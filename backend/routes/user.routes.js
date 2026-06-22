import express from 'express';
import {
  getUserProfile, updateProfile, followUser,
  searchUsers, getSuggestedUsers, getFollowers, getFollowing,
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadSingle, handleUpload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/search', searchUsers);
router.get('/suggested', getSuggestedUsers);
router.get('/:username/profile', getUserProfile);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);
router.put('/profile', uploadSingle('avatar'), handleUpload('avatars', 'image'), updateProfile);
router.post('/:userId/follow', followUser);

export default router;
