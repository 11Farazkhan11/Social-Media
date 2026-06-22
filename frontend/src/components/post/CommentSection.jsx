import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { HiTrash, HiPaperAirplane } from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';
import api from '../../services/api.js';
import { addCommentToPost, removeCommentFromPost } from '../../redux/slices/postSlice.js';
import toast from 'react-hot-toast';

export default function CommentSection({ postId }) {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/comments/${postId}`);
        setComments(data.data.comments);
      } catch {} finally { setLoading(false); }
    };
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/comments/${postId}`, { text });
      setComments(prev => [data.data.comment, ...prev]);
      dispatch(addCommentToPost({ postId, comment: data.data.comment }));
      setText('');
    } catch { toast.error('Failed to add comment'); } finally { setSubmitting(false); }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));
      dispatch(removeCommentFromPost({ postId, commentId }));
    } catch { toast.error('Failed to delete comment'); }
  };

  return (
    <div className="border-t border-slate-100 dark:border-slate-700 px-4 pb-4">
      {/* Add Comment */}
      <form onSubmit={handleSubmit} className="flex items-center gap-3 pt-3 mb-3">
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
          {user?.avatar?.url
            ? <img src={user.avatar.url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                {user?.username?.[0]?.toUpperCase()}
              </div>
          }
        </div>
        <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            maxLength={500}
          />
          <button type="submit" disabled={!text.trim() || submitting} className="text-brand-500 hover:text-brand-600 disabled:opacity-30 transition-colors">
            <HiPaperAirplane className="text-lg rotate-90" />
          </button>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-2">No comments yet. Be the first!</p>
          ) : comments.map(comment => (
            <div key={comment._id} className="flex items-start gap-2.5 group">
              <Link to={`/profile/${comment.author?.username}`} className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                {comment.author?.avatar?.url
                  ? <img src={comment.author.avatar.url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {comment.author?.username?.[0]?.toUpperCase()}
                    </div>
                }
              </Link>
              <div className="flex-1 min-w-0">
                <div className="bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2">
                  <Link to={`/profile/${comment.author?.username}`} className="text-xs font-bold text-slate-900 dark:text-white hover:text-brand-500">{comment.author?.username}</Link>
                  <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5 break-words">{comment.text}</p>
                </div>
                <p className="text-xs text-slate-400 ml-2 mt-1">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</p>
              </div>
              {(comment.author?._id === user?._id) && (
                <button onClick={() => handleDelete(comment._id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-400 transition-all">
                  <HiTrash className="text-sm" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
