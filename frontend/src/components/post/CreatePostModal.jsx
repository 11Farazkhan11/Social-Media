import { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { HiX, HiPhotograph, HiPaperAirplane } from 'react-icons/hi';
import { setCreatePostOpen } from '../../redux/slices/uiSlice.js';
import { createPost } from '../../redux/slices/postSlice.js';
import toast from 'react-hot-toast';

export default function CreatePostModal() {
  const dispatch = useDispatch();
  const fileRef = useRef();
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState('');

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) { setImage(file); const r = new FileReader(); r.onloadend = () => setPreview(r.result); r.readAsDataURL(file); }
  };

  const handleSubmit = async () => {
    if (!caption.trim() && !image) return toast.error('Add a caption or image');
    setLoading(true);
    try {
      const fd = new FormData();
      if (caption) fd.append('caption', caption);
      if (image) fd.append('image', image);
      if (tags) fd.append('tags', tags);
      await dispatch(createPost(fd)).unwrap();
      toast.success('Post shared!');
      dispatch(setCreatePostOpen(false));
    } catch (err) { toast.error(err || 'Failed to create post'); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) dispatch(setCreatePostOpen(false)); }}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-white text-lg">Create Post</h2>
          <button onClick={() => dispatch(setCreatePostOpen(false))} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
            <HiX className="text-xl" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Caption */}
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="What's on your mind?"
            className="input-field resize-none h-28"
            maxLength={2200}
          />
          <p className="text-xs text-slate-400 text-right -mt-2">{caption.length}/2200</p>

          {/* Image Upload */}
          {!preview ? (
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-900/5 transition-all group"
            >
              <HiPhotograph className="text-4xl text-slate-300 dark:text-slate-500 mx-auto mb-2 group-hover:text-brand-400 transition-colors" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Drag & drop or <span className="text-brand-500 font-semibold">browse</span></p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG, GIF up to 50MB</p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden">
              <img src={preview} alt="Preview" className="w-full max-h-64 object-cover" />
              <button
                onClick={() => { setImage(null); setPreview(null); }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
              >
                <HiX className="text-sm" />
              </button>
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />

          {/* Tags */}
          <input
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="Tags (comma separated, e.g. travel, food, life)"
            className="input-field"
          />

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || (!caption.trim() && !image)}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><HiPaperAirplane className="rotate-90" /> Share Post</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
