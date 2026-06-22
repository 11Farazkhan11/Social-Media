import { Link } from 'react-router-dom';
import { HiHome } from 'react-icons/hi';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-brand-400 to-purple-500 mb-4">404</div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Page not found</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <HiHome /> Go Home
        </Link>
      </div>
    </div>
  );
}
