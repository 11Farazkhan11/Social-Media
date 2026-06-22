import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { HiBell, HiCheck } from 'react-icons/hi';
import api from '../../services/api.js';
import { fetchNotifications, markAllReadLocal } from '../../redux/slices/notificationSlice.js';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function RightPanel() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { notifications, unreadCount } = useSelector(s => s.notifications);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [following, setFollowing] = useState({});

  useEffect(() => {
    dispatch(fetchNotifications());
    api.get('/users/suggested').then(({ data }) => setSuggestedUsers(data.data.users)).catch(() => {});
  }, []);

  const handleFollow = async (userId) => {
    try {
      const { data } = await api.post(`/users/${userId}/follow`);
      setFollowing(prev => ({ ...prev, [userId]: data.data.isFollowing }));
    } catch { toast.error('Failed to follow'); }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      dispatch(markAllReadLocal());
    } catch {}
  };

  return (
    <aside className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-slate-800 border-l border-slate-100 dark:border-slate-700 hidden xl:flex flex-col overflow-y-auto z-20">
      {/* Notifications */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HiBell className="text-slate-600 dark:text-slate-300 text-lg" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-brand-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{unreadCount}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
              <HiCheck className="text-sm" /> Mark all read
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {notifications.slice(0, 8).length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">No notifications yet</p>
          ) : notifications.slice(0, 8).map(notif => (
            <div key={notif._id} className={`flex items-start gap-2.5 p-2 rounded-xl transition-colors ${!notif.isRead ? 'bg-brand-50 dark:bg-brand-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                {notif.sender?.avatar?.url
                  ? <img src={notif.sender.avatar.url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {notif.sender?.username?.[0]?.toUpperCase()}
                    </div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{notif.message}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                </p>
              </div>
              {!notif.isRead && <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Users */}
      <div className="p-5">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3">Suggested for you</h3>
        <div className="space-y-3">
          {suggestedUsers.length === 0 ? (
            <p className="text-xs text-slate-400">No suggestions available</p>
          ) : suggestedUsers.map(u => (
            <div key={u._id} className="flex items-center gap-3">
              <Link to={`/profile/${u.username}`} className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                {u.avatar?.url
                  ? <img src={u.avatar.url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                }
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/profile/${u.username}`} className="text-sm font-semibold text-slate-900 dark:text-white hover:text-brand-500 truncate block">{u.fullName || u.username}</Link>
                <p className="text-xs text-slate-400 truncate">@{u.username} · {u.followers?.length || 0} followers</p>
              </div>
              <button
                onClick={() => handleFollow(u._id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${following[u._id] ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : 'bg-brand-500 text-white hover:bg-brand-600'}`}
              >
                {following[u._id] ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto p-5 text-xs text-slate-300 dark:text-slate-600">
        © 2024 Vibe · Made with ❤️
      </div>
    </aside>
  );
}
