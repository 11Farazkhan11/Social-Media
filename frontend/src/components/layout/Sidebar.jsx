import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiHome, HiSearch, HiMoon, HiSun, HiLogout,
  HiChat, HiPlusCircle, HiViewGrid,
} from 'react-icons/hi';
import { logout } from '../../redux/slices/authSlice.js';
import { toggleDarkMode, setCreatePostOpen } from '../../redux/slices/uiSlice.js';
import api from '../../services/api.js';
import toast from 'react-hot-toast';

function NavItem({ to, icon: Icon, label, badge, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer group
         ${isActive
           ? 'bg-gradient-to-r from-pink-50 to-fuchsia-50 dark:from-pink-900/20 dark:to-fuchsia-900/20 text-pink-600 dark:text-pink-400'
           : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
         }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-pink-500 to-fuchsia-500 rounded-r-full" />
          )}
          <Icon className={`text-xl flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-pink-500' : ''}`} />
          <span className="font-semibold">{label}</span>
          {badge > 0 && (
            <span className="ml-auto min-w-[20px] h-5 px-1 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, refreshToken } = useSelector(s => s.auth);
  const { darkMode } = useSelector(s => s.ui);
  const { unreadCount } = useSelector(s => s.notifications);
  const { chats, onlineUsers } = useSelector(s => s.chat);

  // Count unread messages (chats where last message isn't read by me)
  const unreadMsgs = chats.filter(c => {
    const lm = c.lastMessage;
    if (!lm || !lm.sender) return false;
    const senderId = lm.sender?._id || lm.sender;
    return senderId !== user?._id && lm.readBy && !lm.readBy.includes(user?._id);
  }).length;

  const handleLogout = async () => {
    try { await api.post('/auth/logout', { refreshToken }); } catch {}
    dispatch(logout());
    navigate('/login');
    toast.success('Logged out');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 xl:w-72 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 hidden md:flex flex-col z-30">
      {/* ── Logo ── */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-pink-200 dark:shadow-pink-900/30">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="currentColor" strokeWidth="0"/>
            </svg>
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Vibe</span>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <NavItem to="/" icon={HiHome} label="Home" end />
        <NavItem to="/explore" icon={HiSearch} label="Explore" />

        {/* Messages — prominent with badge */}
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer group
             ${isActive
               ? 'bg-gradient-to-r from-pink-50 to-fuchsia-50 dark:from-pink-900/20 dark:to-fuchsia-900/20 text-pink-600 dark:text-pink-400'
               : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
             }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-pink-500 to-fuchsia-500 rounded-r-full" />}
              <div className="relative">
                <HiChat className={`text-xl transition-transform group-hover:scale-110 ${isActive ? 'text-pink-500' : ''}`} />
                {unreadMsgs > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-pink-500 rounded-full border-2 border-white dark:border-slate-900" />
                )}
              </div>
              <span>Messages</span>
              {unreadMsgs > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                  {unreadMsgs}
                </span>
              )}
            </>
          )}
        </NavLink>

        {/* Create Post */}
        <button
          onClick={() => dispatch(setCreatePostOpen(true))}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white transition-all group"
        >
          <HiPlusCircle className="text-xl group-hover:scale-110 transition-transform group-hover:text-pink-500" />
          Create Post
        </button>

        {/* Profile */}
        {user && (
          <NavLink
            to={`/profile/${user.username}`}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group
               ${isActive
                 ? 'bg-gradient-to-r from-pink-50 to-fuchsia-50 dark:from-pink-900/20 dark:to-fuchsia-900/20 text-pink-600 dark:text-pink-400'
                 : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
               }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-pink-500 to-fuchsia-500 rounded-r-full" />}
                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-offset-1 ring-transparent group-hover:ring-pink-300 dark:group-hover:ring-pink-700 transition-all">
                  {user.avatar?.url
                    ? <img src={user.avatar.url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-pink-400 to-fuchsia-500 flex items-center justify-center text-white text-xs font-black">
                        {user.username?.[0]?.toUpperCase()}
                      </div>
                  }
                </div>
                <span className="truncate">Profile</span>
              </>
            )}
          </NavLink>
        )}

        {/* Divider */}
        <div className="my-3 border-t border-slate-100 dark:border-slate-800" />

        {/* Online contacts preview */}
        {onlineUsers.length > 0 && (() => {
          const onlineContacts = chats
            .map(c => {
              const o = c.participants?.find(p => p._id !== user?._id);
              return o && onlineUsers.includes(o._id) ? o : null;
            })
            .filter(Boolean)
            .slice(0, 5);

          return onlineContacts.length > 0 ? (
            <div className="px-3 py-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Active Now</p>
              <div className="space-y-2">
                {onlineContacts.map(u => (
                  <NavLink
                    key={u._id}
                    to={`/chat/${u._id}`}
                    className="flex items-center gap-2.5 group hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl px-2 py-1.5 transition-all"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-7 h-7 rounded-full overflow-hidden">
                        {u.avatar?.url
                          ? <img src={u.avatar.url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-gradient-to-br from-pink-400 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold">
                              {u.username?.[0]?.toUpperCase()}
                            </div>
                        }
                      </div>
                      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-white dark:border-slate-900" />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate group-hover:text-pink-500 transition-colors">
                      {u.fullName || u.username}
                    </span>
                  </NavLink>
                ))}
              </div>
            </div>
          ) : null;
        })()}
      </nav>

      {/* ── Bottom ── */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-slate-100 dark:border-slate-800 pt-3">
        <button
          onClick={() => dispatch(toggleDarkMode())}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-700 dark:hover:text-slate-200 transition-all group"
        >
          {darkMode
            ? <HiSun className="text-xl text-yellow-400 group-hover:rotate-90 transition-transform" />
            : <HiMoon className="text-xl group-hover:-rotate-12 transition-transform" />
          }
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-500 transition-all group"
        >
          <HiLogout className="text-xl group-hover:translate-x-0.5 transition-transform" />
          Log out
        </button>
      </div>

      {/* ── User card ── */}
      {user && (
        <div className="mx-3 mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
            {user.avatar?.url
              ? <img src={user.avatar.url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-pink-400 to-fuchsia-500 flex items-center justify-center text-white font-black text-sm">
                  {user.username?.[0]?.toUpperCase()}
                </div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">{user.fullName || user.username}</p>
            <p className="text-xs text-slate-400 truncate">@{user.username}</p>
          </div>
          {unreadCount > 0 && (
            <span className="w-5 h-5 bg-pink-500 text-white text-[10px] font-black rounded-full flex items-center justify-center flex-shrink-0">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      )}
    </aside>
  );
}
