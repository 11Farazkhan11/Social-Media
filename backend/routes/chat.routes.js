import express from 'express';
import {
  getOrCreateChat, getMyChats, sendMessage,
  getChatMessages, deleteMessage,
} from '../controllers/chat.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadSingle, handleUpload } from '../middleware/upload.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getMyChats);
router.get('/with/:userId', getOrCreateChat);
router.get('/:chatId/messages', getChatMessages);
router.post('/:chatId/messages', uploadSingle('image'), handleUpload('chat', 'image'), sendMessage);
router.delete('/messages/:messageId', deleteMessage);

export default router;
