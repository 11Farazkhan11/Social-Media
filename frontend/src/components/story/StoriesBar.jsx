import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { HiPlus, HiX, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import api from '../../services/api.js';
import toast from 'react-hot-toast';

export default function StoriesBar() {
  const { user } = useSelector(s => s.auth);
  const [storyGroups, setStoryGroups] = useState([]);
  const [viewingStory, setViewingStory] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    api.get('/stories').then(({ data }) => setStoryGroups(data.data.stories)).catch(() => {});
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('media', file);
      await api.post('/stories', fd);
      toast.success('Story uploaded!');
      const { data } = await api.get('/stories');
      setStoryGroups(data.data.stories);
    } catch { toast.error('Upload failed'); } finally { setUploading(false); e.target.value = ''; }
  };

  const openStory = async (group, idx = 0) => {
    setViewingStory(group);
    setCurrentIdx(idx);
    try { await api.post(`/stories/${group.stories[idx]._id}/view`); } catch {}
  };

  const nextStory = () => {
    if (currentIdx < viewingStory.stories.length - 1) setCurrentIdx(p => p + 1);
    else setViewingStory(null);
  };

  const prevStory = () => { if (currentIdx > 0) setCurrentIdx(p => p - 1); };

  return (
    <>
      <div className="card p-4 mb-4">
        <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none">
          {/* Add Story */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-14 h-14 rounded-full border-2 border-dashed border-brand-300 dark:border-brand-600 flex items-center justify-center hover:border-brand-500 bg-brand-50 dark:bg-brand-900/10 transition-colors"
            >
              {uploading
                ? <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                : <HiPlus className="text-xl text-brand-400" />
              }
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Your Story</span>
          </div>

          {/* Story Groups */}
          {storyGroups.map((group, i) => (
            <div key={i} onClick={() => openStory(group)} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer">
              <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-br from-brand-400 via-purple-500 to-orange-400">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white dark:border-slate-800">
                  {group.author?.avatar?.url
                    ? <img src={group.author.avatar.url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {group.author?.username?.[0]?.toUpperCase()}
                      </div>
                  }
                </div>
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate w-14 text-center">
                {group.author?.username}
              </span>
            </div>
          ))}
        </div>
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
      </div>

      {/* Story Viewer */}
      {viewingStory && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" onClick={() => setViewingStory(null)}>
          <div className="relative w-full max-w-sm h-full max-h-[90vh] mx-auto" onClick={e => e.stopPropagation()}>
            {/* Progress bars */}
            <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
              {viewingStory.stories.map((_, i) => (
                <div key={i} className={`h-0.5 flex-1 rounded-full ${i <= currentIdx ? 'bg-white' : 'bg-white/30'}`} />
              ))}
            </div>

            {/* Author */}
            <div className="absolute top-8 left-3 right-3 flex items-center gap-2 z-10">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white">
                {viewingStory.author?.avatar?.url
                  ? <img src={viewingStory.author.avatar.url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {viewingStory.author?.username?.[0]?.toUpperCase()}
                    </div>
                }
              </div>
              <span className="text-white text-sm font-semibold">{viewingStory.author?.username}</span>
              <button onClick={() => setViewingStory(null)} className="ml-auto text-white hover:text-slate-300">
                <HiX className="text-xl" />
              </button>
            </div>

            {/* Media */}
            <div className="w-full h-full bg-slate-900 rounded-2xl overflow-hidden">
              {viewingStory.stories[currentIdx]?.media?.type === 'video'
                ? <video src={viewingStory.stories[currentIdx].media.url} className="w-full h-full object-contain" autoPlay loop />
                : <img src={viewingStory.stories[currentIdx]?.media?.url} alt="" className="w-full h-full object-contain" />
              }
            </div>

            {/* Navigation */}
            <button onClick={prevStory} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-1">
              <HiChevronLeft className="text-2xl" />
            </button>
            <button onClick={nextStory} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-1">
              <HiChevronRight className="text-2xl" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
