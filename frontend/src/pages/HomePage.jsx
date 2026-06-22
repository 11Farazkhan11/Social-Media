import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeedPosts, resetFeed } from '../redux/slices/postSlice.js';
import PostCard from '../components/post/PostCard.jsx';
import StoriesBar from '../components/story/StoriesBar.jsx';
import { HiOutlinePhotograph } from 'react-icons/hi';
import { useDispatch as useAppDispatch } from 'react-redux';
import { setCreatePostOpen } from '../redux/slices/uiSlice.js';

function PostSkeleton() {
  return (
    <div className="card mb-4 p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32" />
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-24" />
        </div>
      </div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2 w-3/4" />
      <div className="h-56 bg-slate-200 dark:bg-slate-700 rounded-xl" />
    </div>
  );
}

export default function HomePage() {
  const dispatch = useDispatch();
  const { feed, hasMoreFeed, feedPage, loading } = useSelector(s => s.posts);
  const { user } = useSelector(s => s.auth);
  const observerRef = useRef();
  const loadingRef = useRef(false);

  useEffect(() => {
    dispatch(resetFeed());
    dispatch(fetchFeedPosts({ page: 1 }));
  }, []);

  const lastPostRef = useCallback((node) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreFeed && !loadingRef.current) {
        loadingRef.current = true;
        dispatch(fetchFeedPosts({ page: feedPage + 1 })).finally(() => { loadingRef.current = false; });
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loading, hasMoreFeed, feedPage]);

  return (
    <div>
      <StoriesBar />

      {/* Empty State */}
      {!loading && feed.length === 0 && (
        <div className="card p-12 text-center">
          <HiOutlinePhotograph className="text-6xl text-slate-200 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">Your feed is empty</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Follow people to see their posts here, or create your first post!
          </p>
          <button onClick={() => dispatch(setCreatePostOpen(true))} className="btn-primary mx-auto">
            Create First Post
          </button>
        </div>
      )}

      {/* Skeletons */}
      {loading && feed.length === 0 && (
        <>{[1, 2, 3].map(i => <PostSkeleton key={i} />)}</>
      )}

      {/* Posts */}
      {feed.map((post, i) => (
        <div key={post._id} ref={i === feed.length - 1 ? lastPostRef : null}>
          <PostCard post={post} />
        </div>
      ))}

      {/* Loading more */}
      {loading && feed.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!hasMoreFeed && feed.length > 0 && (
        <p className="text-center text-sm text-slate-400 py-6">You've seen all posts ✨</p>
      )}
    </div>
  );
}
