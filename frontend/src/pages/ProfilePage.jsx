import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { HiPhotograph, HiHeart, HiChat, HiCamera, HiPencil, HiCheck, HiX, HiLogout } from 'react-icons/hi';
import api from '../services/api.js';
import { updateUser, logout } from '../redux/slices/authSlice.js';
import toast from 'react-hot-toast';

function EditProfileModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({ fullName: user.fullName || '', bio: user.bio || '', username: user.username || '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar?.url || '');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setAvatarFile(f);
    const r = new FileReader();
    r.onloadend = () => setAvatarPreview(r.result);
    r.readAsDataURL(f);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (avatarFile) fd.append('avatar', avatarFile);
      const { data } = await api.put('/users/profile', fd);
      onSave(data.data.user);
      toast.success('Profile updated!');
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-white">Edit Profile</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><HiX /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
              <div className="w-20 h-20 rounded-full overflow-hidden">
                {avatarPreview
                  ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                      {user.username?.[0]?.toUpperCase()}
                    </div>
                }
              </div>
              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <HiCamera className="text-white text-xl" />
              </div>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

          <div className="space-y-3">
            <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Full name" className="input-field" maxLength={50} />
            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Username" className="input-field" maxLength={30} />
            <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Bio (max 200 chars)" className="input-field resize-none h-20" maxLength={200} />
            <p className="text-xs text-slate-400 text-right -mt-1">{form.bio.length}/200</p>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><HiCheck /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user: currentUser, refreshToken } = useSelector(s => s.auth);
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [savedPosts, setSavedPosts] = useState([]);

  const isOwn = currentUser?.username === username;

  useEffect(() => {
    setLoading(true);
    api.get(`/users/${username}/profile`)
      .then(({ data }) => {
        setProfileData(data.data.user);
        setPosts(data.data.posts);
        setIsFollowing(data.data.user.followers?.some(f => (f._id || f) === currentUser?._id));
      })
      .catch(() => { toast.error('User not found'); navigate('/'); })
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    if (isOwn && activeTab === 'saved') {
      api.get('/posts/saved').then(({ data }) => setSavedPosts(data.data.posts)).catch(() => {});
    }
  }, [activeTab, isOwn]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const { data } = await api.post(`/users/${profileData._id}/follow`);
      setIsFollowing(data.data.isFollowing);
      setProfileData(prev => ({
        ...prev,
        followers: data.data.isFollowing
          ? [...prev.followers, { _id: currentUser._id }]
          : prev.followers.filter(f => (f._id || f) !== currentUser._id),
      }));
    } catch { toast.error('Action failed'); } finally { setFollowLoading(false); }
  };

  const handleMessage = async () => {
    try {
      await api.get(`/chat/with/${profileData._id}`);
      navigate(`/chat/${profileData._id}`);
    } catch { toast.error('Failed to open chat'); }
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout', { refreshToken }); } catch {}
    dispatch(logout());
    navigate('/login');
  };

  const handleProfileSaved = (updatedUser) => {
    setProfileData(prev => ({ ...prev, ...updatedUser }));
    dispatch(updateUser(updatedUser));
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="card p-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-40" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
              <div className="flex gap-6 mt-2">
                {[1,2,3].map(i => <div key={i} className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16" />)}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!profileData) return null;

  const displayPosts = activeTab === 'saved' ? savedPosts : posts;

  return (
    <div>
      {/* Profile Card */}
      <div className="card p-6 mb-4">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-brand-100 dark:border-brand-900/30">
              {profileData.avatar?.url
                ? <img src={profileData.avatar.url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white text-3xl font-black">
                    {profileData.username?.[0]?.toUpperCase()}
                  </div>
              }
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white">{profileData.fullName || profileData.username}</h1>
                <p className="text-sm text-slate-400">@{profileData.username}</p>
              </div>
              {isOwn && (
                <div className="flex gap-2">
                  <button onClick={() => setEditOpen(true)} className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1">
                    <HiPencil /> Edit
                  </button>
                  <button onClick={handleLogout} className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10">
                    <HiLogout />
                  </button>
                </div>
              )}
              {!isOwn && (
                <div className="flex gap-2">
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${isFollowing ? 'btn-outline' : 'btn-primary'}`}
                  >
                    {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button onClick={handleMessage} className="btn-outline text-sm px-4 py-2">Message</button>
                </div>
              )}
            </div>

            {profileData.bio && (
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{profileData.bio}</p>
            )}

            {/* Stats */}
            <div className="flex gap-5 mt-4">
              {[
                { label: 'Posts', count: posts.length },
                { label: 'Followers', count: profileData.followers?.length || 0 },
                { label: 'Following', count: profileData.following?.length || 0 },
              ].map(({ label, count }) => (
                <div key={label} className="text-center">
                  <p className="font-black text-slate-900 dark:text-white text-lg leading-none">{count}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        {['posts', ...(isOwn ? ['saved'] : [])].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Posts Grid */}
      {displayPosts.length === 0 ? (
        <div className="card p-12 text-center">
          <HiPhotograph className="text-5xl text-slate-200 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {activeTab === 'saved' ? 'No saved posts yet' : 'No posts yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {displayPosts.map(post => (
            <div
              key={post._id}
              onClick={() => setSelectedPost(post)}
              className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden cursor-pointer relative group"
            >
              {post.image?.url
                ? <img src={post.image.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                : <div className="w-full h-full flex items-center justify-center p-3">
                    <p className="text-xs text-slate-500 dark:text-slate-300 line-clamp-3 text-center">{post.caption}</p>
                  </div>
              }
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 gap-3">
                <span className="text-white text-sm font-bold flex items-center gap-1"><HiHeart /> {post.likes?.length || 0}</span>
                <span className="text-white text-sm font-bold flex items-center gap-1"><HiChat /> {post.comments?.length || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPost(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full shadow-2xl animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
            {selectedPost.image?.url && (
              <img src={selectedPost.image.url} alt="" className="w-full max-h-72 object-cover" />
            )}
            <div className="p-5">
              {selectedPost.caption && <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap mb-3">{selectedPost.caption}</p>}
              <div className="flex gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1"><HiHeart className="text-red-400" /> {selectedPost.likes?.length || 0}</span>
                <span className="flex items-center gap-1"><HiChat className="text-brand-400" /> {selectedPost.comments?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {editOpen && <EditProfileModal user={profileData} onClose={() => setEditOpen(false)} onSave={handleProfileSaved} />}
    </div>
  );
}
