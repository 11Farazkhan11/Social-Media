import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  fetchMyChats, fetchOrCreateChat, fetchMessages, sendMessage,
  setActiveChat,
} from '../redux/slices/chatSlice.js';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import {
  HiPaperAirplane, HiPhotograph, HiArrowLeft, HiX,
  HiEmojiHappy, HiSearch, HiPhone, HiVideoCamera,
  HiTrash, HiOutlinePhotograph, HiOutlineChat,
  HiPlus, HiCheckCircle, HiInformationCircle,
  HiUserAdd, HiBan,
} from 'react-icons/hi';
import { joinChat, leaveChat, emitTyping, emitStopTyping } from '../services/socket.js';
import api from '../services/api.js';
import EmojiPicker from 'emoji-picker-react';
import toast from 'react-hot-toast';

/* ─── Helpers ──────────────────────────────────────────────── */
const fmtTime = (d) => format(new Date(d), 'HH:mm');
const fmtDate = (d) => {
  const date = new Date(d);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
};

/* ─── Avatar ───────────────────────────────────────────────── */
function Avatar({ user, size = 'md', online }) {
  const sz = { xs: 'w-7 h-7', sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12', xl: 'w-16 h-16' };
  const dot = { xs: 'w-2 h-2', sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3', xl: 'w-3.5 h-3.5' };
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sz[size]} rounded-full overflow-hidden`}>
        {user?.avatar?.url
          ? <img src={user.avatar.url} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-pink-400 via-fuchsia-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
              {user?.username?.[0]?.toUpperCase() ?? '?'}
            </div>
        }
      </div>
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 ${dot[size]} rounded-full border-2 border-white dark:border-slate-900 transition-colors ${online ? 'bg-emerald-400' : 'bg-slate-300 dark:bg-slate-600'}`} />
      )}
    </div>
  );
}

/* ─── New Chat Modal ───────────────────────────────────────── */
function NewChatModal({ onClose, onStart }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const t = useRef();

  const search = (val) => {
    setQ(val);
    clearTimeout(t.current);
    if (!val.trim()) { setResults([]); return; }
    t.current = setTimeout(async () => {
      setBusy(true);
      try { const { data } = await api.get(`/users/search?q=${encodeURIComponent(val)}`); setResults(data.data.users); }
      catch {} finally { setBusy(false); }
    }, 350);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-900 dark:text-white flex-1">New Message</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"><HiX /></button>
        </div>
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input autoFocus value={q} onChange={e => search(e.target.value)} placeholder="Search people..." className="w-full pl-9 pr-3 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-400" />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {busy && <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" /></div>}
          {!busy && q && results.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No users found</p>}
          {!busy && !q && <div className="py-10 text-center px-4"><HiUserAdd className="text-3xl text-slate-200 dark:text-slate-600 mx-auto mb-2" /><p className="text-sm text-slate-400">Search to find people</p></div>}
          {results.map(u => (
            <button key={u._id} onClick={() => onStart(u._id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left">
              <Avatar user={u} size="md" />
              <div className="min-w-0">
                <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{u.fullName || u.username}</p>
                <p className="text-xs text-slate-400">@{u.username} · {u.followers?.length || 0} followers</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Info Panel ───────────────────────────────────────────── */
function InfoPanel({ otherUser, msgs, onClose }) {
  const media = msgs.filter(m => m.image?.url && !m.isDeleted);
  return (
    <div className="w-72 xl:w-80 bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <span className="font-bold text-slate-900 dark:text-white text-sm">Details</span>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"><HiX className="text-sm" /></button>
      </div>
      {/* Profile */}
      <div className="flex flex-col items-center py-7 px-5 gap-2 border-b border-slate-100 dark:border-slate-800">
        <Avatar user={otherUser} size="xl" />
        <div className="text-center mt-1">
          <p className="font-black text-slate-900 dark:text-white text-lg">{otherUser?.fullName || otherUser?.username}</p>
          <p className="text-xs text-slate-400">@{otherUser?.username}</p>
        </div>
        <Link to={`/profile/${otherUser?.username}`} onClick={onClose} className="mt-1 text-xs font-semibold text-pink-500 hover:text-pink-600 border border-pink-200 dark:border-pink-800/50 px-4 py-1.5 rounded-full transition-colors">
          View Profile →
        </Link>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 p-4 border-b border-slate-100 dark:border-slate-800">
        {[
          { label: 'Messages', val: msgs.filter(m => !m.isDeleted).length },
          { label: 'Media', val: media.length },
        ].map(({ label, val }) => (
          <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{val}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      {/* Media grid */}
      {media.length > 0 && (
        <div className="p-4">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <HiOutlinePhotograph /> Shared Media
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {media.slice(0, 9).map(m => (
              <a key={m._id} href={m.image.url} target="_blank" rel="noreferrer" className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700">
                <img src={m.image.url} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform duration-200" />
              </a>
            ))}
          </div>
          {media.length > 9 && <p className="text-xs text-slate-400 text-center mt-2">+{media.length - 9} more</p>}
        </div>
      )}
    </div>
  );
}

/* ─── Message Bubble ───────────────────────────────────────── */
const QUICK_REACTS = ['❤️', '😂', '😮', '👍', '🔥', '😢'];

function Bubble({ msg, isMine, otherUser, showAva, onDelete }) {
  const [hover, setHover] = useState(false);
  return (
    <div className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>

      {/* Avatar col */}
      {!isMine && <div className="w-8 flex-shrink-0">{showAva && <Avatar user={otherUser} size="sm" />}</div>}

      {/* Bubble */}
      <div className={`relative max-w-[65%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {msg.image?.url && !msg.isDeleted && (
          <a href={msg.image.url} target="_blank" rel="noreferrer" className="mb-1 block">
            <img src={msg.image.url} alt="" className={`max-h-60 max-w-full object-cover shadow-lg ${isMine ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'}`} />
          </a>
        )}
        {(msg.text || msg.isDeleted) && (
          <div className={`px-4 py-2.5 text-sm leading-relaxed ${
            msg.isDeleted
              ? 'text-slate-400 dark:text-slate-500 italic text-xs py-2'
              : isMine
              ? 'bg-gradient-to-br from-pink-500 to-fuchsia-600 text-white rounded-2xl rounded-br-sm shadow-md shadow-pink-200 dark:shadow-pink-900/20'
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-bl-sm shadow-sm border border-slate-100 dark:border-slate-700'
          }`}>
            {msg.isDeleted ? <span className="flex items-center gap-1"><HiBan className="text-sm" /> Message deleted</span> : msg.text}
          </div>
        )}
        <div className={`flex items-center gap-1 mt-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-slate-400">{fmtTime(msg.createdAt)}</span>
          {isMine && !msg.isDeleted && <HiCheckCircle className="text-[10px] text-slate-300 dark:text-slate-600" />}
        </div>
      </div>

      {/* Hover actions */}
      {!msg.isDeleted && hover && (
        <div className={`flex items-center gap-1 ${isMine ? 'order-first mr-1' : 'ml-1'}`}>
          <div className="flex bg-white dark:bg-slate-800 shadow-lg border border-slate-100 dark:border-slate-700 rounded-2xl px-1 py-0.5 gap-0.5">
            {QUICK_REACTS.slice(0, 5).map(e => (
              <button key={e} className="px-1.5 py-1 text-sm hover:scale-125 transition-transform rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">{e}</button>
            ))}
          </div>
          {isMine && (
            <button onClick={() => onDelete(msg._id)} className="p-1.5 bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700 rounded-full text-slate-300 hover:text-red-400 transition-colors">
              <HiTrash className="text-xs" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function ChatPage() {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user: me } = useSelector(s => s.auth);
  const { chats, activeChat, messages, loading, onlineUsers, typingUsers } = useSelector(s => s.chat);

  const [text, setText] = useState('');
  const [imgFile, setImgFile] = useState(null);
  const [imgPrev, setImgPrev] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const [showLeft, setShowLeft] = useState(!userId);
  const [showInfo, setShowInfo] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [listSearch, setListSearch] = useState('');

  const bottomRef = useRef();
  const fileRef = useRef();
  const typingTimer = useRef();
  const taRef = useRef();

  /* Init */
  useEffect(() => { dispatch(fetchMyChats()); }, []);
  useEffect(() => {
    if (userId) { dispatch(fetchOrCreateChat(userId)); setShowLeft(false); }
  }, [userId]);
  useEffect(() => {
    if (!activeChat) return;
    joinChat(activeChat._id);
    dispatch(fetchMessages({ chatId: activeChat._id, page: 1 }));
    return () => leaveChat(activeChat._id);
  }, [activeChat?._id]);
  useEffect(() => { setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60); }, [messages[activeChat?._id]?.length]);

  /* Handlers */
  const handleTyping = () => {
    if (!activeChat) return;
    emitTyping(activeChat._id, me._id, me.username);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitStopTyping(activeChat._id, me._id), 2000);
  };

  const pickFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    setImgFile(f);
    const r = new FileReader(); r.onloadend = () => setImgPrev(r.result); r.readAsDataURL(f);
    e.target.value = '';
  };

  const send = async () => {
    if (!text.trim() && !imgFile) return;
    if (!activeChat) return;
    setSending(true);
    const saved = text.trim(); setText(''); setShowEmoji(false);
    if (taRef.current) { taRef.current.style.height = '44px'; }
    try {
      const fd = new FormData();
      if (saved) fd.append('text', saved);
      if (imgFile) fd.append('image', imgFile);
      await dispatch(sendMessage({ chatId: activeChat._id, formData: fd })).unwrap();
      setImgFile(null); setImgPrev(null);
      emitStopTyping(activeChat._id, me._id);
    } catch { setText(saved); toast.error('Failed to send'); } finally { setSending(false); }
  };

  const deleteMsg = async (id) => {
    try { await api.delete(`/chat/messages/${id}`); toast.success('Deleted'); }
    catch { toast.error('Could not delete'); }
  };

  const openChat = (chat) => { dispatch(setActiveChat(chat)); setShowLeft(false); setShowInfo(false); navigate('/chat'); };

  const startNew = async (uid) => {
    setShowNewChat(false);
    try { await dispatch(fetchOrCreateChat(uid)).unwrap(); setShowLeft(false); }
    catch { toast.error('Failed'); }
  };

  /* Derived */
  const getOther = (c) => c?.participants?.find(p => p._id !== me?._id);
  const other = getOther(activeChat);
  const otherOnline = onlineUsers.includes(other?._id);
  const chatMsgs = messages[activeChat?._id] || [];
  const typers = activeChat ? Object.values(typingUsers[activeChat._id] || {}).filter(u => u !== me?.username) : [];

  const filteredChats = chats.filter(c => {
    const o = getOther(c);
    const q = listSearch.toLowerCase();
    return !q || o?.username?.toLowerCase().includes(q) || o?.fullName?.toLowerCase().includes(q);
  });

  // Group messages
  const grouped = chatMsgs.map((msg, i) => {
    const prev = chatMsgs[i - 1];
    const newDay = !prev || new Date(msg.createdAt).toDateString() !== new Date(prev?.createdAt).toDateString();
    const sameSender = prev && (prev.sender?._id || prev.sender) === (msg.sender?._id || msg.sender);
    const gap = prev ? (new Date(msg.createdAt) - new Date(prev.createdAt)) / 60000 : 999;
    return { msg, newDay, showAva: !sameSender || gap > 5, topGap: !sameSender || gap > 5 };
  });

  /* ─────────────────────────────────────── */
  return (
    <div className="flex h-[calc(100vh-4.5rem)] md:h-screen -mx-4 -my-6 overflow-hidden bg-slate-100 dark:bg-slate-950">

      {/* ══════════ LEFT PANEL — Conversation List ══════════ */}
      <aside className={`
        ${showLeft ? 'flex' : 'hidden md:flex'}
        flex-col w-full md:w-[300px] lg:w-[320px] flex-shrink-0
        bg-white dark:bg-slate-900
        border-r border-slate-200 dark:border-slate-800
        shadow-sm
      `}>
        {/* Top */}
        <div className="px-4 pt-5 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Messages
            </h1>
            <button
              onClick={() => setShowNewChat(true)}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center text-white shadow-md hover:shadow-pink-300 dark:hover:shadow-pink-900 hover:scale-105 transition-all"
              title="New Message"
            >
              <HiPlus className="text-base" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
            <input
              value={listSearch}
              onChange={e => setListSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full pl-9 pr-8 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all"
            />
            {listSearch && (
              <button onClick={() => setListSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <HiX className="text-xs" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto pt-1 pb-3">
          {filteredChats.length === 0 && !listSearch && (
            <div className="flex flex-col items-center justify-center h-full pb-16 text-center px-6">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-pink-100 to-fuchsia-100 dark:from-pink-900/20 dark:to-fuchsia-900/20 flex items-center justify-center mb-4 shadow-sm">
                <HiOutlineChat className="text-2xl text-pink-400" />
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-200 mb-1 text-sm">No chats yet</p>
              <p className="text-xs text-slate-400 mb-5">Start a conversation with someone</p>
              <button
                onClick={() => setShowNewChat(true)}
                className="flex items-center gap-1.5 text-sm font-semibold text-pink-500 hover:text-pink-600 transition-colors"
              >
                <HiPlus /> New Message
              </button>
            </div>
          )}

          {filteredChats.length === 0 && listSearch && (
            <p className="text-center text-sm text-slate-400 py-10">No matches for "{listSearch}"</p>
          )}

          {filteredChats.map(chat => {
            const o = getOther(chat);
            const online = onlineUsers.includes(o?._id);
            const active = activeChat?._id === chat._id;
            const lm = chat.lastMessage;

            return (
              <button
                key={chat._id}
                onClick={() => openChat(chat)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3.5 transition-all relative ${
                  active
                    ? 'bg-gradient-to-r from-pink-50 to-fuchsia-50 dark:from-pink-900/10 dark:to-fuchsia-900/10'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                {active && <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-gradient-to-b from-pink-500 to-fuchsia-500" />}
                <Avatar user={o} size="md" online={online} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-1 mb-0.5">
                    <span className={`text-sm font-semibold truncate ${active ? 'text-pink-600 dark:text-pink-400' : 'text-slate-900 dark:text-white'}`}>
                      {o?.fullName || o?.username}
                    </span>
                    {lm?.createdAt && (
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {formatDistanceToNow(new Date(lm.createdAt), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {lm?.isDeleted ? '🚫 Deleted' : lm?.text || (lm?.image ? '📷 Photo' : 'No messages yet')}
                  </p>
                </div>
                {online && <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </aside>

      {/* ══════════ CENTER — Chat Window ════════════════════ */}
      <main className={`${!showLeft ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 bg-slate-50 dark:bg-slate-950`}>

        {/* ── Empty state ── */}
        {!activeChat && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-5">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-indigo-500 flex items-center justify-center shadow-2xl shadow-pink-200 dark:shadow-pink-900/30">
                <HiPaperAirplane className="text-white text-4xl -rotate-45" />
              </div>
              <span className="absolute -top-2 -right-2 text-2xl select-none">✨</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Your Messages</h2>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">Send private messages and photos to friends and followers.</p>
            </div>
            <button
              onClick={() => setShowNewChat(true)}
              className="flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white font-bold rounded-2xl shadow-xl shadow-pink-200 dark:shadow-pink-900/30 hover:shadow-2xl hover:scale-[1.03] transition-all text-sm"
            >
              <HiPlus /> Send Message
            </button>
          </div>
        )}

        {/* ── Active chat ── */}
        {activeChat && (
          <>
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center gap-3 flex-shrink-0">
              <button onClick={() => { setShowLeft(true); setShowInfo(false); }} className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                <HiArrowLeft className="text-lg" />
              </button>

              <Link to={`/profile/${other?.username}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity group">
                <Avatar user={other} size="md" online={otherOnline} />
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white text-sm truncate group-hover:text-pink-500 transition-colors">
                    {other?.fullName || other?.username}
                  </p>
                  <p className={`text-xs font-medium ${typers.length ? 'text-pink-500' : otherOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {typers.length ? 'typing…' : otherOnline ? '● Active now' : 'Offline'}
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button title="Voice call (UI only)" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-pink-500 transition-colors">
                  <HiPhone className="text-lg" />
                </button>
                <button title="Video call (UI only)" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-pink-500 transition-colors">
                  <HiVideoCamera className="text-lg" />
                </button>
                <button
                  onClick={() => setShowInfo(p => !p)}
                  className={`p-2 rounded-xl transition-colors ${showInfo ? 'bg-pink-100 dark:bg-pink-900/20 text-pink-500' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-pink-500'}`}
                >
                  <HiInformationCircle className="text-lg" />
                </button>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-0.5">
              {loading && chatMsgs.length === 0 && (
                <div className="flex justify-center py-16">
                  <div className="w-10 h-10 border-[3px] border-pink-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!loading && chatMsgs.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-16 gap-3 text-center">
                  <Avatar user={other} size="xl" />
                  <div>
                    <p className="font-black text-slate-900 dark:text-white text-lg">{other?.fullName || other?.username}</p>
                    <p className="text-xs text-slate-400">@{other?.username}</p>
                  </div>
                  <div className="mt-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-sm text-slate-500">
                    Say hello! 👋 No messages yet.
                  </div>
                </div>
              )}

              {grouped.map(({ msg, newDay, showAva, topGap }, i) => {
                const isMine = (msg.sender?._id || msg.sender) === me?._id;
                return (
                  <div key={msg._id} className={topGap && i > 0 ? 'mt-4' : ''}>
                    {newDay && (
                      <div className="flex items-center justify-center my-5">
                        <div className="px-4 py-1 bg-slate-200/70 dark:bg-slate-800 rounded-full text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {fmtDate(msg.createdAt)}
                        </div>
                      </div>
                    )}
                    <Bubble
                      msg={msg}
                      isMine={isMine}
                      otherUser={other}
                      showAva={showAva}
                      onDelete={deleteMsg}
                    />
                  </div>
                );
              })}

              {/* Typing dots */}
              {typers.length > 0 && (
                <div className="flex items-end gap-2 mt-4">
                  <div className="w-8"><Avatar user={other} size="sm" /></div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                    <div className="flex gap-1 items-center h-4">
                      {[0, 180, 360].map(d => (
                        <span key={d} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms`, animationDuration: '900ms' }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Image preview strip */}
            {imgPrev && (
              <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
                <div className="relative inline-block group">
                  <img src={imgPrev} alt="" className="h-24 rounded-2xl object-cover shadow-md" />
                  <button
                    onClick={() => { setImgFile(null); setImgPrev(null); }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                  >
                    <HiX className="text-xs" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    Ready to send
                  </div>
                </div>
              </div>
            )}

            {/* Emoji picker */}
            {showEmoji && (
              <div className="absolute bottom-[72px] left-4 z-30 shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <EmojiPicker
                  onEmojiClick={d => { setText(p => p + d.emoji); taRef.current?.focus(); }}
                  theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                  height={320}
                  width={300}
                  searchDisabled={false}
                  skinTonesDisabled
                  previewConfig={{ showPreview: false }}
                />
              </div>
            )}

            {/* Input bar */}
            <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-3 pt-3 pb-4 flex-shrink-0">
              <div className="flex items-end gap-2">
                {/* Left buttons */}
                <div className="flex gap-0.5 pb-0.5 flex-shrink-0">
                  <button
                    onClick={() => setShowEmoji(p => !p)}
                    className={`p-2.5 rounded-2xl transition-all ${showEmoji ? 'bg-pink-100 dark:bg-pink-900/20 text-pink-500' : 'text-slate-400 hover:text-pink-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <HiEmojiHappy className="text-xl" />
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="p-2.5 rounded-2xl text-slate-400 hover:text-pink-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <HiPhotograph className="text-xl" />
                  </button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />

                {/* Textarea */}
                <textarea
                  ref={taRef}
                  value={text}
                  onChange={e => { setText(e.target.value); handleTyping(); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Message…"
                  rows={1}
                  className="flex-1 resize-none bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all overflow-y-auto leading-5"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />

                {/* Send */}
                <button
                  onClick={send}
                  disabled={sending || (!text.trim() && !imgFile)}
                  className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-fuchsia-600 text-white shadow-lg shadow-pink-200 dark:shadow-pink-900/20 hover:shadow-xl hover:scale-[1.06] disabled:opacity-40 disabled:scale-100 disabled:shadow-none transition-all active:scale-95"
                >
                  {sending
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <HiPaperAirplane className="text-base rotate-90" />
                  }
                </button>
              </div>
              <p className="text-[10px] text-center text-slate-300 dark:text-slate-700 mt-2">
                Enter to send · Shift+Enter for new line
              </p>
            </footer>
          </>
        )}
      </main>

      {/* ══════════ RIGHT — Info Panel ════════════════════════ */}
      {showInfo && activeChat && (
        <div className="hidden lg:block flex-shrink-0">
          <InfoPanel otherUser={other} msgs={chatMsgs} onClose={() => setShowInfo(false)} />
        </div>
      )}

      {/* Modals */}
      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} onStart={startNew} />}
    </div>
  );
}
