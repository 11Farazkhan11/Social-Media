import { NavLink, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HiHome, HiSearch, HiChat, HiPlusCircle, HiUser } from 'react-icons/hi';
import { setCreatePostOpen } from '../../redux/slices/uiSlice.js';

export default function MobileNav() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector(s => s.auth);
  const { chats, onlineUsers } = useSelector(s => s.chat);

  // Count unread chat messages
  const unreadMsgs = chats.filter(c => {
    const lm = c.lastMessage;
    if (!lm || !lm.sender) return false;
    const senderId = lm.sender?._id || lm.sender;
    return senderId !== user?._id && lm.readBy && !lm.readBy.includes(user?._id);
  }).length;

  const onChat = location.pathname.startsWith('/chat');

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden z-40">
      {/* Frosted glass bar */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 safe-area-inset-bottom">
        <div className="flex items-center h-16 px-2">

          {/* Home */}
          <NavLink to="/" end className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-all ${isActive ? 'text-pink-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`
          }>
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-pink-50 dark:bg-pink-900/20' : ''}`}>
                  <HiHome className={`text-2xl transition-transform ${isActive ? 'scale-110' : ''}`} />
                </div>
                <span className={`text-[10px] font-bold ${isActive ? 'text-pink-500' : 'text-slate-400'}`}>Home</span>
              </>
            )}
          </NavLink>

          {/* Explore */}
          <NavLink to="/explore" className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-all ${isActive ? 'text-pink-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`
          }>
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-pink-50 dark:bg-pink-900/20' : ''}`}>
                  <HiSearch className={`text-2xl transition-transform ${isActive ? 'scale-110' : ''}`} />
                </div>
                <span className={`text-[10px] font-bold ${isActive ? 'text-pink-500' : 'text-slate-400'}`}>Explore</span>
              </>
            )}
          </NavLink>

          {/* Create — center pill button */}
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={() => dispatch(setCreatePostOpen(true))}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-pink-200 dark:shadow-pink-900/40 hover:scale-110 active:scale-95 transition-all"
            >
              <HiPlusCircle className="text-white text-2xl" />
            </button>
          </div>

          {/* Messages */}
          <NavLink to="/chat" className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-all ${isActive ? 'text-pink-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`
          }>
            {({ isActive }) => (
              <>
                <div className={`relative p-1.5 rounded-xl transition-all ${isActive ? 'bg-pink-50 dark:bg-pink-900/20' : ''}`}>
                  <HiChat className={`text-2xl transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {unreadMsgs > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-pink-500 to-fuchsia-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white dark:border-slate-900">
                      {unreadMsgs > 9 ? '9+' : unreadMsgs}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold ${isActive ? 'text-pink-500' : 'text-slate-400'}`}>Chat</span>
              </>
            )}
          </NavLink>

          {/* Profile */}
          <NavLink to={user ? `/profile/${user.username}` : '/login'} className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-all ${isActive ? 'text-pink-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`
          }>
            {({ isActive }) => (
              <>
                <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-pink-50 dark:bg-pink-900/20 ring-2 ring-pink-400' : ''}`}>
                  {user?.avatar?.url
                    ? <img src={user.avatar.url} alt="" className="w-7 h-7 rounded-full object-cover" />
                    : <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black
                        ${isActive ? 'bg-gradient-to-br from-pink-400 to-fuchsia-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                        {user?.username?.[0]?.toUpperCase() || <HiUser className="text-base" />}
                      </div>
                  }
                </div>
                <span className={`text-[10px] font-bold ${isActive ? 'text-pink-500' : 'text-slate-400'}`}>Profile</span>
              </>
            )}
          </NavLink>

        </div>
      </div>
    </nav>
  );
}
