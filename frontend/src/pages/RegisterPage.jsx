import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HiMail, HiLockClosed, HiUser, HiEye, HiEyeOff, HiPhotograph } from 'react-icons/hi';
import { registerUser } from '../redux/slices/authSlice.js';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const { loading } = useSelector(s => s.auth);
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'Username is required';
    else if (form.username.length < 3) e.username = 'Min 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = 'Letters, numbers, underscores only';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Min 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await dispatch(registerUser(form)).unwrap();
      toast.success('Account created! Welcome to Vibe 🎉');
    } catch (err) { toast.error(err || 'Registration failed'); }
  };

  const field = (name, placeholder, type = 'text', Icon) => (
    <div>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
        <input
          type={type === 'password' ? (showPass ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={form[name]}
          onChange={e => { setForm({ ...form, [name]: e.target.value }); if (errors[name]) setErrors({ ...errors, [name]: '' }); }}
          className={`input-field pl-11 ${type === 'password' ? 'pr-11' : ''} ${errors[name] ? 'border-red-400 focus:ring-red-400' : ''}`}
        />
        {type === 'password' && (
          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showPass ? <HiEyeOff /> : <HiEye />}
          </button>
        )}
      </div>
      {errors[name] && <p className="text-xs text-red-500 mt-1 ml-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-slate-100 dark:border-slate-700">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center shadow-lg mx-auto mb-4">
              <HiPhotograph className="text-white text-3xl" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Vibe</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Join the community</p>
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {field('fullName', 'Full name (optional)', 'text', HiUser)}
            {field('username', 'Username', 'text', HiUser)}
            {field('email', 'Email address', 'email', HiMail)}
            {field('password', 'Password', 'password', HiLockClosed)}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3 mt-2">
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : 'Create Account'
              }
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-4">
            By signing up you agree to our Terms and Privacy Policy.
          </p>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-500 font-semibold hover:text-brand-600 transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
