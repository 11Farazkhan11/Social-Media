import express from 'express';
import {
  createPost, getFeedPosts, getExplorePosts, getPostById,
  updatePost, deletePost, likePost, savePost, getSavedPosts,
} from '../controllers/post.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadSingle, handleUpload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/feed', getFeedPosts);
router.get('/explore', getExplorePosts);
router.get('/saved', getSavedPosts);
router.get('/:id', getPostById);
router.post('/', uploadSingle('image'), handleUpload('posts', 'image'), createPost);
router.put('/:id', uploadSingle('image'), handleUpload('posts', 'image'), updatePost);
router.delete('/:id', deletePost);
router.post('/:id/like', likePost);
router.post('/:id/save', savePost);

export default router;
