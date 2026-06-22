import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const fetchMyChats = createAsyncThunk('chat/myChats', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/chat');
    return data.data.chats;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchOrCreateChat = createAsyncThunk('chat/getOrCreate', async (userId, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/chat/with/${userId}`);
    return data.data.chat;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchMessages = createAsyncThunk('chat/messages', async ({ chatId, page = 1 }, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/chat/${chatId}/messages?page=${page}&limit=30`);
    return { chatId, messages: data.data.messages, hasMore: data.data.hasMore, page };
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const sendMessage = createAsyncThunk('chat/send', async ({ chatId, formData }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/chat/${chatId}/messages`, formData);
    return { chatId, message: data.data.message };
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    chats: [], activeChat: null, messages: {}, hasMore: {}, loading: false,
    onlineUsers: [], typingUsers: {},
  },
  reducers: {
    setActiveChat: (state, action) => { state.activeChat = action.payload; },
    receiveMessage: (state, action) => {
      const { chatId, message } = action.payload;
      if (!state.messages[chatId]) state.messages[chatId] = [];
      const exists = state.messages[chatId].find(m => m._id === message._id);
      if (!exists) state.messages[chatId].push(message);
      const chatIdx = state.chats.findIndex(c => c._id === chatId);
      if (chatIdx > -1) {
        state.chats[chatIdx].lastMessage = message;
        state.chats[chatIdx].updatedAt = message.createdAt;
        const [chat] = state.chats.splice(chatIdx, 1);
        state.chats.unshift(chat);
      }
    },
    setOnlineUsers: (state, action) => { state.onlineUsers = action.payload; },
    setTyping: (state, action) => {
      const { chatId, userId, username } = action.payload;
      if (!state.typingUsers[chatId]) state.typingUsers[chatId] = {};
      state.typingUsers[chatId][userId] = username;
    },
    clearTyping: (state, action) => {
      const { chatId, userId } = action.payload;
      if (state.typingUsers[chatId]) delete state.typingUsers[chatId][userId];
    },
    messageDeleted: (state, action) => {
      const { messageId } = action.payload;
      Object.keys(state.messages).forEach(chatId => {
        const msg = state.messages[chatId]?.find(m => m._id === messageId);
        if (msg) { msg.isDeleted = true; msg.text = 'This message was deleted'; }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyChats.fulfilled, (state, action) => { state.chats = action.payload; })
      .addCase(fetchOrCreateChat.fulfilled, (state, action) => {
        state.activeChat = action.payload;
        const exists = state.chats.find(c => c._id === action.payload._id);
        if (!exists) state.chats.unshift(action.payload);
      })
      .addCase(fetchMessages.pending, (state) => { state.loading = true; })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { chatId, messages, hasMore, page } = action.payload;
        if (page === 1) state.messages[chatId] = messages;
        else state.messages[chatId] = [...messages, ...(state.messages[chatId] || [])];
        state.hasMore[chatId] = hasMore;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { chatId, message } = action.payload;
        if (!state.messages[chatId]) state.messages[chatId] = [];
        state.messages[chatId].push(message);
      });
  },
});

export const { setActiveChat, receiveMessage, setOnlineUsers, setTyping, clearTyping, messageDeleted } = chatSlice.actions;
export default chatSlice.reducer;
