# 🎯 Vibe — Full-Stack Social Media App (MERN)

A production-ready Instagram/Twitter-style social media platform built with the MERN stack, featuring real-time messaging, stories, notifications, and more.

---

## 🚀 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS (dark mode, custom design system) |
| State | Redux Toolkit |
| Backend | Node.js + Express.js (ESM) |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens) |
| File Uploads | Cloudinary |
| Real-time | Socket.io |
| HTTP Client | Axios (with interceptors) |

---

## 📁 Project Structure

```
socialmedia/
├── backend/
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   ├── cloudinary.js       # Cloudinary setup + upload utility
│   │   └── socket.js           # Socket.io initialization + online users
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── post.controller.js
│   │   ├── comment.controller.js
│   │   ├── chat.controller.js
│   │   ├── notification.controller.js
│   │   └── story.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT protect
│   │   ├── error.middleware.js  # Global error handler + asyncHandler
│   │   └── upload.middleware.js # Multer + Cloudinary upload
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Post.model.js
│   │   ├── Comment.model.js
│   │   ├── Chat.model.js        # Chat + Message schemas
│   │   ├── Notification.model.js
│   │   └── Story.model.js       # TTL index for auto-delete
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── post.routes.js
│   │   ├── comment.routes.js
│   │   ├── chat.routes.js
│   │   ├── notification.routes.js
│   │   └── story.routes.js
│   ├── utils/
│   │   ├── jwt.utils.js
│   │   └── notification.utils.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── MainLayout.jsx
    │   │   │   ├── Sidebar.jsx
    │   │   │   ├── MobileNav.jsx
    │   │   │   └── RightPanel.jsx
    │   │   ├── post/
    │   │   │   ├── PostCard.jsx
    │   │   │   ├── CommentSection.jsx
    │   │   │   └── CreatePostModal.jsx
    │   │   └── story/
    │   │       └── StoriesBar.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── HomePage.jsx
    │   │   ├── ExplorePage.jsx
    │   │   ├── ProfilePage.jsx
    │   │   ├── ChatPage.jsx
    │   │   └── NotFoundPage.jsx
    │   ├── redux/
    │   │   ├── store.js
    │   │   └── slices/
    │   │       ├── authSlice.js
    │   │       ├── postSlice.js
    │   │       ├── chatSlice.js
    │   │       ├── notificationSlice.js
    │   │       └── uiSlice.js
    │   ├── services/
    │   │   ├── api.js            # Axios + auto-refresh interceptors
    │   │   └── socket.js         # Socket.io client
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## ⚙️ Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Cloudinary** account (free tier is fine)
- **npm** or **yarn**

---

## 🛠️ Setup Instructions

### 1. Clone / download the project

```bash
cd socialmedia
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
```

Edit `backend/.env` with your values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/socialmedia
# Or for Atlas: mongodb+srv://<user>:<pass>@cluster.mongodb.net/socialmedia

JWT_ACCESS_SECRET=your_very_long_random_secret_here_at_least_32_chars
JWT_REFRESH_SECRET=another_very_long_random_secret_here_different_from_above
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

> **Getting Cloudinary credentials:**
> 1. Sign up at https://cloudinary.com (free)
> 2. Go to Dashboard → copy Cloud Name, API Key, API Secret

```bash
# Start backend (development)
npm run dev

# OR production
npm start
```

Backend runs on `http://localhost:5000`

---

### 3. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

> **Note:** With the Vite proxy configured in `vite.config.js`, you can also just use `/api` for VITE_API_URL when running in dev mode and it will proxy to the backend automatically.

```bash
# Start frontend (development)
npm run dev
```

Frontend runs on `http://localhost:5173`

---

### 4. Enable MongoDB TTL for Stories (auto-delete after 24h)

MongoDB automatically handles TTL indexes. The Story model already defines:

```js
expiresAt: {
  type: Date,
  default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
  index: { expires: 0 },
}
```

Mongoose will create this TTL index on first run. MongoDB checks TTL every 60 seconds.

---

## 🌐 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/logout` | Yes | Logout |
| POST | `/api/auth/refresh` | No | Refresh access token |
| GET | `/api/auth/me` | Yes | Get current user |

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users/search?q=` | Yes | Search users |
| GET | `/api/users/suggested` | Yes | Suggested users |
| GET | `/api/users/:username/profile` | Yes | Get user profile + posts |
| PUT | `/api/users/profile` | Yes | Update profile (multipart) |
| POST | `/api/users/:userId/follow` | Yes | Follow / Unfollow toggle |
| GET | `/api/users/:userId/followers` | Yes | Get followers list |
| GET | `/api/users/:userId/following` | Yes | Get following list |

### Posts
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/posts/feed?page=` | Yes | Home feed (paginated) |
| GET | `/api/posts/explore?page=` | Yes | All public posts |
| GET | `/api/posts/saved` | Yes | Saved posts |
| POST | `/api/posts` | Yes | Create post (multipart) |
| GET | `/api/posts/:id` | Yes | Get single post |
| PUT | `/api/posts/:id` | Yes | Edit post |
| DELETE | `/api/posts/:id` | Yes | Delete post |
| POST | `/api/posts/:id/like` | Yes | Like / Unlike toggle |
| POST | `/api/posts/:id/save` | Yes | Save / Unsave toggle |

### Comments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/comments/:postId` | Yes | Get post comments |
| POST | `/api/comments/:postId` | Yes | Add comment |
| DELETE | `/api/comments/:commentId` | Yes | Delete comment |

### Chat
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/chat` | Yes | Get my chats |
| GET | `/api/chat/with/:userId` | Yes | Get/create chat with user |
| GET | `/api/chat/:chatId/messages` | Yes | Get messages (paginated) |
| POST | `/api/chat/:chatId/messages` | Yes | Send message |
| DELETE | `/api/chat/messages/:messageId` | Yes | Delete message |

### Notifications
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | Yes | Get all notifications |
| GET | `/api/notifications/unread-count` | Yes | Unread count |
| PUT | `/api/notifications/mark-all-read` | Yes | Mark all read |
| PUT | `/api/notifications/:id/read` | Yes | Mark one read |
| DELETE | `/api/notifications/:id` | Yes | Delete notification |

### Stories
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/stories` | Yes | Get stories from following |
| POST | `/api/stories` | Yes | Upload story (multipart) |
| POST | `/api/stories/:id/view` | Yes | Mark story as viewed |
| DELETE | `/api/stories/:id` | Yes | Delete own story |

---

## 🔌 Socket.io Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `user:online` | `userId` | Register user as online |
| `chat:join` | `chatId` | Join a chat room |
| `chat:leave` | `chatId` | Leave a chat room |
| `chat:typing` | `{ chatId, userId, username }` | Typing indicator |
| `chat:stopTyping` | `{ chatId, userId }` | Stop typing |

### Server → Client
| Event | Payload | Description |
|---|---|---|
| `users:online` | `userId[]` | Updated online users list |
| `message:new` | `{ chatId, message }` | New chat message |
| `message:deleted` | `{ messageId }` | Message was deleted |
| `chat:typing` | `{ userId, username }` | Someone is typing |
| `chat:stopTyping` | `{ userId }` | Someone stopped typing |
| `notification:new` | `Notification` | New notification |

---

## ✨ Features Overview

### ✅ Implemented
- 🔐 JWT auth (access + refresh tokens, auto-refresh)
- 👤 User profiles with avatar upload
- 📝 Post CRUD (text + image via Cloudinary)
- ❤️ Like / Unlike posts
- 💬 Comments with delete
- 🔖 Save / Unsave posts
- 🏠 Home feed (following users, infinite scroll)
- 🔍 Explore page (grid layout, search users)
- 📸 Stories (image/video, auto-delete 24h, viewer count)
- 💌 Real-time 1:1 chat (Socket.io)
- ⌨️ Typing indicators
- 🟢 Online / Offline status
- 🔔 Real-time notifications (likes, comments, follows)
- 🌙 Dark mode toggle (persisted)
- 📱 Responsive design (mobile nav)
- 🎨 Image preview before upload
- 😀 Emoji picker in chat
- ♾️ Infinite scroll (feed + explore)
- 📋 Suggested users panel
- 🗑️ Soft-delete chat messages

---

## 🏗️ Production Deployment

### Backend (e.g. Railway, Render, Fly.io)

```bash
cd backend
npm start
```

Set all environment variables in your hosting dashboard.

### Frontend (e.g. Vercel, Netlify)

```bash
cd frontend
npm run build
# Deploy the /dist folder
```

Set `VITE_API_URL` and `VITE_SOCKET_URL` to your backend's production URL.

### MongoDB Atlas

Use a free M0 cluster. Add your server's IP to the allowlist.

---

## 🔒 Security Notes

- Passwords hashed with bcrypt (12 rounds)
- JWT stored in memory (access) + Redux (not localStorage for access token)
- Refresh tokens stored in MongoDB, rotated on each use, max 5 active
- File type validation on uploads
- File size limited to 50MB
- Auth middleware on all protected routes
- Input validation via Mongoose schema constraints

---

## 📦 Dependencies Summary

### Backend
```
express, mongoose, bcryptjs, jsonwebtoken,
cloudinary, multer, socket.io, cors, morgan, dotenv
```

### Frontend
```
react, react-dom, react-router-dom, @reduxjs/toolkit,
react-redux, axios, socket.io-client, react-hot-toast,
react-icons, date-fns, emoji-picker-react
```

---

## 🐛 Troubleshooting

**CORS errors** — Make sure `CLIENT_URL` in backend `.env` exactly matches your frontend URL including port.

**Socket not connecting** — Ensure `VITE_SOCKET_URL` points to backend. In dev, the Vite proxy handles `/socket.io`.

**Cloudinary upload fails** — Double-check all three Cloudinary credentials in `.env`.

**MongoDB connection fails** — Check URI format. For Atlas, ensure your IP is whitelisted and the URI includes the database name.

**Stories not auto-deleting** — Ensure the TTL index was created. Run `db.stories.getIndexes()` in MongoDB shell.
