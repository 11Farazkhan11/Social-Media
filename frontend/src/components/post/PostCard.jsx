import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HiHeart, HiOutlineHeart, HiChat, HiTrash, HiDotsHorizontal, HiBookmark, HiOutlineBookmark, HiPencil } from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';
import { toggleLike, deletePost } from '../../redux/slices/postSlice.js';
import CommentSection from './CommentSection.jsx';
import api from '../../services/api.js';
import toast from 'react-hot-toast';

export default function PostCard({ post }) {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [saved, setSaved] = useState(false);
  const [localLiked, setLocalLiked] = useState(post.likes?.includes(user?._id));
  const [localLikesCount, setLocalLikesCount] = useState(post.likes?.length || 0);

  const isOwner = post.author?._id === user?._id;

  const handleLike = async () => {
    setLocalLiked(!localLiked);
    setLocalLikesCount(prev => localLiked ? prev - 1 : prev + 1);
    dispatch(toggleLike(post._id));
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    dispatch(deletePost(post._id));
    toast.success('Post deleted');
    setShowMenu(false);
  };

  const handleSave = async () => {
    try {
      await api.post(`/posts/${post._id}/save`);
      setSaved(!saved);
      toast.success(saved ? 'Unsaved' : 'Saved!');
    } catch { toast.error('Failed to save'); }
  };

  return (
    <article className="card mb-4 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link to={`/profile/${post.author?.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            {post.author?.avatar?.url
              ? <img src={post.author.avatar.url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white font-bold">
                  {post.author?.username?.[0]?.toUpperCase()}
                </div>
            }
          </div>
          <div>
            <p className="font-bold text-sm text-slate-900 dark:text-white">{post.author?.fullName || post.author?.username}</p>
            <p className="text-xs text-slate-400">@{post.author?.username} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
          </div>
        </Link>

        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
            <HiDotsHorizontal />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-700 rounded-xl shadow-lg border border-slate-100 dark:border-slate-600 py-1 w-40 z-10">
              <button onClick={handleSave} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600">
                {saved ? <HiBookmark className="text-brand-500" /> : <HiOutlineBookmark />}
                {saved ? 'Unsave' : 'Save Post'}
              </button>
              {isOwner && (
                <button onClick={handleDelete} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10">
                  <HiTrash /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pb-3">
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{post.caption}</p>
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {post.tags.map(tag => (
                <span key={tag} className="text-xs text-brand-500 font-medium">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image */}
      {post.image?.url && (
        <div className="aspect-square overflow-hidden">
          <img src={post.image.url} alt="Post" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-4 border-t border-slate-50 dark:border-slate-700/50">
        <button onClick={handleLike} className="flex items-center gap-1.5 text-sm font-medium group transition-all">
          {localLiked
            ? <HiHeart className="text-xl text-red-500 scale-110 transition-transform" />
            : <HiOutlineHeart className="text-xl text-slate-400 group-hover:text-red-400 transition-colors" />
          }
          <span className={`${localLiked ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>{localLikesCount}</span>
        </button>

        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-500 transition-colors group">
          <HiChat className="text-xl group-hover:scale-110 transition-transform" />
          <span>{post.comments?.length || 0}</span>
        </button>

        <button onClick={handleSave} className="ml-auto text-slate-400 hover:text-brand-500 transition-colors">
          {saved ? <HiBookmark className="text-xl text-brand-500" /> : <HiOutlineBookmark className="text-xl" />}
        </button>
      </div>

      {/* Comments */}
      {showComments && <CommentSection postId={post._id} />}
    </article>
  );
}
