import Notification from '../models/Notification.model.js';
import { getSocketId } from '../config/socket.js';

export const createNotification = async (io, { recipient, sender, type, post, comment, message }) => {
  if (recipient.toString() === sender.toString()) return; // Don't notify yourself

  const notification = await Notification.create({
    recipient,
    sender,
    type,
    post: post || null,
    comment: comment || null,
    message: message || '',
  });

  const populated = await notification.populate('sender', 'username avatar fullName');

  // Emit to recipient if online
  const socketId = getSocketId(recipient.toString());
  if (socketId && io) {
    io.to(socketId).emit('notification:new', populated);
  }

  return populated;
};
