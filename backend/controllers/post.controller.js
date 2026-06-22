import Post from '../models/Post.model.js';
import User from '../models/User.model.js';
import Comment from '../models/Comment.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';
import { createNotification } from '../utils/notification.utils.js';

const POST_POPULATE = [
  { path: 'author', select: 'username avatar fullName' },
  { path: 'comments', populate: { path: 'author', select: 'username avatar fullName' } },
];

export const createPost = asyncHandler(async (req, res) => {
  const { caption, tags } = req.body;

  if (!caption && !req.uploadedFile) {
    return res.status(400).json({ success: false, message: 'Post must have caption or image' });
  }

  const postData = { author: req.user._id, caption };
  if (tags) postData.tags = tags.split(',').map(t => t.trim()).filter(Boolean);
  if (req.uploadedFile) {
    postData.image = { url: req.uploadedFile.url, publicId: req.uploadedFile.publicId };
  }

  const post = await Post.create(postData);
  const populated = await post.populate(POST_POPULATE);

  res.status(201).json({ success: true, message: 'Post created', data: { post: populated } });
});

export const getFeedPosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const user = await User.findById(req.user._id);
  const followingIds = [...user.following, req.user._id];

  const posts = await Post.find({ author: { $in: followingIds }, isPublic: true })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate(POST_POPULATE);

  const total = await Post.countDocuments({ author: { $in: followingIds }, isPublic: true });

  res.status(200).json({
    success: true,
    data: { posts, page, totalPages: Math.ceil(total / limit), hasMore: skip + posts.length < total },
  });
});

export const getExplorePosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const posts = await Post.find({ isPublic: true })
    .sort({ likes: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'username avatar fullName');

  const total = await Post.countDocuments({ isPublic: true });

  res.status(200).json({
    success: true,
    data: { posts, page, totalPages: Math.ceil(total / limit), hasMore: skip + posts.length < total },
  });
});

export const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate(POST_POPULATE);
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
  res.status(200).json({ success: true, data: { post } });
});

export const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
  if (post.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const { caption, tags } = req.body;
  if (caption !== undefined) post.caption = caption;
  if (tags !== undefined) post.tags = tags.split(',').map(t => t.trim()).filter(Boolean);

  if (req.uploadedFile) {
    if (post.image?.publicId) await deleteFromCloudinary(post.image.publicId);
    post.image = { url: req.uploadedFile.url, publicId: req.uploadedFile.publicId };
  }

  await post.save();
  const populated = await post.populate(POST_POPULATE);
  res.status(200).json({ success: true, message: 'Post updated', data: { post: populated } });
});

export const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
  if (post.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  if (post.image?.publicId) await deleteFromCloudinary(post.image.publicId);
  await Comment.deleteMany({ post: post._id });
  await post.deleteOne();

  res.status(200).json({ success: true, message: 'Post deleted' });
});

export const likePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

  const isLiked = post.likes.includes(req.user._id);

  if (isLiked) {
    post.likes.pull(req.user._id);
    await post.save();
    res.status(200).json({ success: true, data: { liked: false, likesCount: post.likes.length } });
  } else {
    post.likes.push(req.user._id);
    await post.save();

    if (post.author.toString() !== req.user._id.toString()) {
      await createNotification(req.io, {
        recipient: post.author,
        sender: req.user._id,
        type: 'like',
        post: post._id,
        message: `${req.user.username} liked your post`,
      });
    }

    res.status(200).json({ success: true, data: { liked: true, likesCount: post.likes.length } });
  }
});

export const savePost = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const isSaved = user.savedPosts.includes(req.params.id);

  if (isSaved) {
    user.savedPosts.pull(req.params.id);
  } else {
    user.savedPosts.push(req.params.id);
  }
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, data: { saved: !isSaved } });
});

export const getSavedPosts = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'savedPosts',
    populate: { path: 'author', select: 'username avatar fullName' },
  });
  res.status(200).json({ success: true, data: { posts: user.savedPosts } });
});
