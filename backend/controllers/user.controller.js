import User from '../models/User.model.js';
import Post from '../models/Post.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';
import { createNotification } from '../utils/notification.utils.js';

export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username })
    .populate('followers', 'username avatar fullName')
    .populate('following', 'username avatar fullName');

  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const posts = await Post.find({ author: user._id, isPublic: true })
    .sort({ createdAt: -1 })
    .populate('author', 'username avatar fullName');

  res.status(200).json({ success: true, data: { user, posts } });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, bio, username } = req.body;

  if (username && username !== req.user.username) {
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ success: false, message: 'Username already taken' });
  }

  const updateData = {};
  if (fullName !== undefined) updateData.fullName = fullName;
  if (bio !== undefined) updateData.bio = bio;
  if (username !== undefined) updateData.username = username;

  if (req.uploadedFile) {
    if (req.user.avatar?.publicId) {
      await deleteFromCloudinary(req.user.avatar.publicId);
    }
    updateData.avatar = {
      url: req.uploadedFile.url,
      publicId: req.uploadedFile.publicId,
    };
  }

  const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });
  res.status(200).json({ success: true, message: 'Profile updated', data: { user } });
});

export const followUser = asyncHandler(async (req, res) => {
  if (req.params.userId === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
  }

  const targetUser = await User.findById(req.params.userId);
  if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

  const isFollowing = req.user.following.includes(req.params.userId);

  if (isFollowing) {
    // Unfollow
    await User.findByIdAndUpdate(req.user._id, { $pull: { following: req.params.userId } });
    await User.findByIdAndUpdate(req.params.userId, { $pull: { followers: req.user._id } });
    res.status(200).json({ success: true, message: 'Unfollowed successfully', data: { isFollowing: false } });
  } else {
    // Follow
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: req.params.userId } });
    await User.findByIdAndUpdate(req.params.userId, { $addToSet: { followers: req.user._id } });

    await createNotification(req.io, {
      recipient: req.params.userId,
      sender: req.user._id,
      type: 'follow',
      message: `${req.user.username} started following you`,
    });

    res.status(200).json({ success: true, message: 'Followed successfully', data: { isFollowing: true } });
  }
});

export const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ success: false, message: 'Query required' });

  const users = await User.find({
    $or: [
      { username: { $regex: q, $options: 'i' } },
      { fullName: { $regex: q, $options: 'i' } },
    ],
    _id: { $ne: req.user._id },
  }).select('username avatar fullName followers').limit(20);

  res.status(200).json({ success: true, data: { users } });
});

export const getSuggestedUsers = asyncHandler(async (req, res) => {
  const users = await User.find({
    _id: { $ne: req.user._id, $nin: req.user.following },
  }).select('username avatar fullName followers').limit(10);

  res.status(200).json({ success: true, data: { users } });
});

export const getFollowers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).populate('followers', 'username avatar fullName bio');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.status(200).json({ success: true, data: { followers: user.followers } });
});

export const getFollowing = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).populate('following', 'username avatar fullName bio');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.status(200).json({ success: true, data: { following: user.following } });
});
