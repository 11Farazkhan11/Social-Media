import { Chat, Message } from '../models/Chat.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { getSocketId } from '../config/socket.js';

export const getOrCreateChat = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  let chat = await Chat.findOne({
    participants: { $all: [req.user._id, userId] },
    isGroupChat: false,
  }).populate('participants', 'username avatar fullName')
    .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'username avatar' } });

  if (!chat) {
    chat = await Chat.create({ participants: [req.user._id, userId] });
    chat = await chat.populate('participants', 'username avatar fullName');
  }

  res.status(200).json({ success: true, data: { chat } });
});

export const getMyChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ participants: req.user._id })
    .populate('participants', 'username avatar fullName')
    .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'username' } })
    .sort({ updatedAt: -1 });

  res.status(200).json({ success: true, data: { chats } });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { text } = req.body;

  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
  if (!chat.participants.includes(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Not a participant' });
  }

  if (!text && !req.uploadedFile) {
    return res.status(400).json({ success: false, message: 'Message must have text or image' });
  }

  const msgData = { chat: chatId, sender: req.user._id, text: text || '', readBy: [req.user._id] };
  if (req.uploadedFile) {
    msgData.image = { url: req.uploadedFile.url, publicId: req.uploadedFile.publicId };
  }

  const message = await Message.create(msgData);
  await message.populate('sender', 'username avatar fullName');

  chat.lastMessage = message._id;
  chat.updatedAt = new Date();
  await chat.save();

  // Emit to all chat participants
  chat.participants.forEach(participantId => {
    if (participantId.toString() !== req.user._id.toString()) {
      const socketId = getSocketId(participantId.toString());
      if (socketId) {
        req.io.to(socketId).emit('message:new', { chatId, message });
      }
    }
  });

  // Emit to chat room
  req.io.to(chatId).emit('message:new', { chatId, message });

  res.status(201).json({ success: true, data: { message } });
});

export const getChatMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 30;
  const skip = (page - 1) * limit;

  const chat = await Chat.findById(chatId);
  if (!chat || !chat.participants.includes(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const messages = await Message.find({ chat: chatId, isDeleted: false })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'username avatar fullName');

  // Mark messages as read
  await Message.updateMany(
    { chat: chatId, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } }
  );

  const total = await Message.countDocuments({ chat: chatId });

  res.status(200).json({
    success: true,
    data: { messages: messages.reverse(), hasMore: skip + messages.length < total },
  });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
  if (message.sender.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  message.isDeleted = true;
  message.text = 'This message was deleted';
  await message.save();

  req.io.to(message.chat.toString()).emit('message:deleted', { messageId: message._id });
  res.status(200).json({ success: true, message: 'Message deleted' });
});
