import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import postReducer from './slices/postSlice.js';
import chatReducer from './slices/chatSlice.js';
import notificationReducer from './slices/notificationSlice.js';
import uiReducer from './slices/uiSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postReducer,
    chat: chatReducer,
    notifications: notificationReducer,
    ui: uiReducer,
  },
});
