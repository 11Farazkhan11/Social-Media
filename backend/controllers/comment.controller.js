import Comment from '../models/Comment.model.js';
import Post from '../models/Post.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { createNotification } from '../utils/notification.utils.js';

export const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

  const comment = await Comment.create({ post: post._id, author: req.user._id, text });
  post.comments.push(comment._id);
  await post.save({ validateBeforeSave: false });

  const populated = await comment.populate('author', 'username avatar fullName');

  if (post.author.toString() !== req.user._id.toString()) {
    await createNotification(req.io, {
      recipient: post.author,
      sender: req.user._id,
      type: 'comment',
      post: post._id,
      comment: comment._id,
      message: `${req.user.username} commented on your post`,
    });
  }

  res.status(201).json({ success: true, data: { comment: populated } });
});

export const getComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ post: req.params.postId })
    .sort({ createdAt: -1 })
    .populate('author', 'username avatar fullName');
  res.status(200).json({ success: true, data: { comments } });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

  const post = await Post.findById(comment.post);
  if (
    comment.author.toString() !== req.user._id.toString() &&
    post?.author.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  await Post.findByIdAndUpdate(comment.post, { $pull: { comments: comment._id } });
  await comment.deleteOne();

  res.status(200).json({ success: true, message: 'Comment deleted' });
});
