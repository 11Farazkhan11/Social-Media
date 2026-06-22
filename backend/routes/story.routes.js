import express from 'express';
import { createStory, getFollowingStories, viewStory, deleteStory } from '../controllers/story.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadSingle, handleUpload } from '../middleware/upload.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getFollowingStories);
router.post('/', uploadSingle('media'), handleUpload('stories', 'auto'), createStory);
router.post('/:id/view', viewStory);
router.delete('/:id', deleteStory);

export default router;
