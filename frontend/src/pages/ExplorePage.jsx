import { useEffect, useRef, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExplorePosts } from '../redux/slices/postSlice.js';
import { HiSearch, HiX, HiHeart, HiChat } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

function PostGridItem({ post, onClick }) {
  return (
    <div
      onClick={() => onClick(post)}
      className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden cursor-pointer relative group"
    >
      {post.image?.url
        ? <img src={post.image.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        : <div className="w-full h-full flex items-center justify-center p-3">
            <p className="text-xs text-slate-500 dark:text-slate-300 text-center line-clamp-4">{post.caption}</p>
          </div>
      }
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 gap-4">
        <span className="flex items-center gap-1 text-white font-bold text-sm">
          <HiHeart /> {post.likes?.length || 0}
        </span>
        <span className="flex items-center gap-1 text-white font-bold text-sm">
          <HiChat /> {post.comments?.length || 0}
        </span>
      </div>
    </div>
  );
}

function PostModal({ post, onClose }) {
  if (!post) return null;
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex shadow-2xl" onClick={e => e.stopPropagation()}>
        {post.image?.url && (
          <div className="w-1/2 bg-black flex-shrink-0">
            <img src={post.image.url} alt="" className="w-full h-full object-contain" />
          </div>
        )}
        <div className="flex-1 flex flex-col p-5 overflow-y-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link to={`/profile/${post.author?.username}`} onClick={onClose} className="w-9 h-9 rounded-full overflow-hidden">
              {post.author?.avatar?.url
                ? <img src={post.author.avatar.url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white font-bold">
                    {post.author?.username?.[0]?.toUpperCase()}
                  </div>
              }
            </Link>
            <div>
              <Link to={`/profile/${post.author?.username}`} onClick={onClose} className="font-bold text-sm text-slate-900 dark:text-white hover:text-brand-500">{post.author?.username}</Link>
              <p className="text-xs text-slate-400">{post.author?.fullName}</p>
            </div>
          </div>
          {post.caption && <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{post.caption}</p>}
          <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <span className="flex items-center gap-1.5 text-sm text-slate-500"><HiHeart className="text-red-400" /> {post.likes?.length || 0} likes</span>
            <span className="flex items-center gap-1.5 text-sm text-slate-500"><HiChat className="text-brand-400" /> {post.comments?.length || 0} comments</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const dispatch = useDispatch();
  const { explorePosts, hasMoreExplore, explorePage, loading } = useSelector(s => s.posts);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const observerRef = useRef();
  const searchTimer = useRef();

  useEffect(() => { dispatch(fetchExplorePosts({ page: 1 })); }, []);

  const lastRef = useCallback((node) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreExplore) {
        dispatch(fetchExplorePosts({ page: explorePage + 1 }));
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loading, hasMoreExplore, explorePage]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    if (!val.trim()) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/users/search?q=${encodeURIComponent(val)}`);
        setSearchResults(data.data.users);
      } catch {} finally { setSearching(false); }
    }, 400);
  };

  return (
    <div>
      {/* Search Bar */}
      <div className="relative mb-6">
        <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search users..."
          className="input-field pl-11 pr-10"
        />
        {search && (
          <button onClick={() => { setSearch(''); setSearchResults([]); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <HiX />
          </button>
        )}

        {/* Search Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-20">
            {searching && <div className="p-4 text-center text-sm text-slate-400">Searching...</div>}
            {searchResults.map(u => (
              <Link key={u._id} to={`/profile/${u.username}`} onClick={() => { setSearch(''); setSearchResults([]); }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                  {u.avatar?.url
                    ? <img src={u.avatar.url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {u.username?.[0]?.toUpperCase()}
                      </div>
                  }
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{u.fullName || u.username}</p>
                  <p className="text-xs text-slate-400">@{u.username} · {u.followers?.length || 0} followers</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Posts Grid */}
      <h2 className="font-bold text-slate-900 dark:text-white text-lg mb-4">Explore</h2>
      <div className="grid grid-cols-3 gap-2">
        {explorePosts.map((post, i) => (
          <div key={post._id} ref={i === explorePosts.length - 1 ? lastRef : null}>
            <PostGridItem post={post} onClick={setSelectedPost} />
          </div>
        ))}
        {loading && [...Array(6)].map((_, i) => (
          <div key={i} className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />
        ))}
      </div>

      {!hasMoreExplore && explorePosts.length > 0 && (
        <p className="text-center text-sm text-slate-400 py-6">You've explored everything ✨</p>
      )}

      <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </div>
  );
}
