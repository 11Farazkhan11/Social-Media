import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from './redux/slices/authSlice.js';
import { fetchUnreadCount } from './redux/slices/notificationSlice.js';
import { initSocket, getSocket } from './services/socket.js';
import {
  receiveMessage, setOnlineUsers, setTyping, clearTyping, messageDeleted,
} from './redux/slices/chatSlice.js';
import { addNotification } from './redux/slices/notificationSlice.js';

import MainLayout from './components/layout/MainLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import HomePage from './pages/HomePage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import ExplorePage from './pages/ExplorePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

const ProtectedRoute = ({ children }) => {
  const { accessToken } = useSelector(s => s.auth);
  return accessToken ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { accessToken } = useSelector(s => s.auth);
  return !accessToken ? children : <Navigate to="/" replace />;
};

export default function App() {
  const dispatch = useDispatch();
  const { user, accessToken } = useSelector(s => s.auth);

  // Fetch current user on mount if token exists
  useEffect(() => {
    if (accessToken) {
      dispatch(fetchMe());
      dispatch(fetchUnreadCount());
    }
  }, [accessToken]);

  // Init socket + bind all real-time events
  useEffect(() => {
    if (!user?._id) return;

    const socket = initSocket(user._id);

    socket.on('message:new', ({ chatId, message }) => {
      dispatch(receiveMessage({ chatId, message }));
    });

    socket.on('message:deleted', ({ messageId }) => {
      dispatch(messageDeleted({ messageId }));
    });

    socket.on('users:online', (userIds) => {
      dispatch(setOnlineUsers(userIds));
    });

    socket.on('chat:typing', ({ userId, username, chatId }) => {
      dispatch(setTyping({ chatId: chatId || 'unknown', userId, username }));
    });

    socket.on('chat:stopTyping', ({ userId, chatId }) => {
      dispatch(clearTyping({ chatId: chatId || 'unknown', userId }));
    });

    socket.on('notification:new', (notification) => {
      dispatch(addNotification(notification));
    });

    return () => {
      const s = getSocket();
      if (s) {
        s.off('message:new');
        s.off('message:deleted');
        s.off('users:online');
        s.off('chat:typing');
        s.off('chat:stopTyping');
        s.off('notification:new');
      }
    };
  }, [user?._id]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Protected routes inside shell */}
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index             element={<HomePage />} />
        <Route path="explore"    element={<ExplorePage />} />

        {/* Messages / Chat — two URL spellings, with optional userId param */}
        <Route path="chat"              element={<ChatPage />} />
        <Route path="chat/:userId"      element={<ChatPage />} />
        <Route path="messages"          element={<ChatPage />} />
        <Route path="messages/:userId"  element={<ChatPage />} />

        <Route path="profile/:username" element={<ProfilePage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
