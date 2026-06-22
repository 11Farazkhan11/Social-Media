import express from 'express';
import { addComment, getComments, deleteComment } from '../controllers/comment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);
router.get('/:postId', getComments);
router.post('/:postId', addComment);
router.delete('/:commentId', deleteComment);
export default router;
