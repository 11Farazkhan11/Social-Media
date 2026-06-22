import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar.jsx';
import MobileNav from './MobileNav.jsx';
import RightPanel from './RightPanel.jsx';
import CreatePostModal from '../post/CreatePostModal.jsx';

export default function MainLayout() {
  const { createPostOpen } = useSelector(s => s.ui);
  const { pathname } = useLocation();

  // Chat / messages pages need full bleed, no padding, no right panel
  const isChat = pathname.startsWith('/chat') || pathname.startsWith('/messages');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* ── Left Sidebar (always shown on md+) ── */}
      <Sidebar />

      {/* ── Main content area ── */}
      <main
        className={`
          flex-1 min-h-screen
          ml-0 md:ml-64 xl:ml-72
          ${isChat ? '' : 'xl:mr-80'}
          ${isChat ? 'overflow-hidden' : ''}
        `}
      >
        {isChat ? (
          /* Chat: full bleed, no wrapper padding */
          <Outlet />
        ) : (
          /* Regular pages: centred, padded */
          <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
            <Outlet />
          </div>
        )}
      </main>

      {/* ── Right panel — hidden on chat pages ── */}
      {!isChat && <RightPanel />}

      {/* ── Mobile bottom nav ── */}
      <MobileNav />

      {/* ── Create Post Modal ── */}
      {createPostOpen && <CreatePostModal />}
    </div>
  );
}
