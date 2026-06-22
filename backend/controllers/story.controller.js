import Story from '../models/Story.model.js';
import User from '../models/User.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';

export const createStory = asyncHandler(async (req, res) => {
  if (!req.uploadedFile) {
    return res.status(400).json({ success: false, message: 'Media file is required' });
  }

  const story = await Story.create({
    author: req.user._id,
    media: {
      url: req.uploadedFile.url,
      publicId: req.uploadedFile.publicId,
      type: req.uploadedFile.type === 'video' ? 'video' : 'image',
    },
    caption: req.body.caption || '',
  });

  const populated = await story.populate('author', 'username avatar fullName');
  res.status(201).json({ success: true, data: { story: populated } });
});

export const getFollowingStories = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const authorIds = [...user.following, req.user._id];

  const stories = await Story.find({
    author: { $in: authorIds },
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .populate('author', 'username avatar fullName');

  // Group by author
  const grouped = {};
  stories.forEach(story => {
    const authorId = story.author._id.toString();
    if (!grouped[authorId]) {
      grouped[authorId] = { author: story.author, stories: [] };
    }
    grouped[authorId].stories.push(story);
  });

  res.status(200).json({ success: true, data: { stories: Object.values(grouped) } });
});

export const viewStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) return res.status(404).json({ success: false, message: 'Story not found' });

  if (!story.viewers.includes(req.user._id)) {
    story.viewers.push(req.user._id);
    await story.save({ validateBeforeSave: false });
  }

  res.status(200).json({ success: true, data: { viewersCount: story.viewers.length } });
});

export const deleteStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) return res.status(404).json({ success: false, message: 'Story not found' });
  if (story.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  await deleteFromCloudinary(story.media.publicId, story.media.type);
  await story.deleteOne();

  res.status(200).json({ success: true, message: 'Story deleted' });
});
