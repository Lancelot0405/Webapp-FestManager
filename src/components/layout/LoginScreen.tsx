import { useState } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

const DOMAIN = '@festmanager.com';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const { login } = useApp();
  const [mode,       setMode]      = useState<Mode>('login');
  const [username,   setUsername]  = useState('');
  const [displayName,setDisplayName] = useState('');
  const [password,   setPassword]  = useState('');
  const [password2,  setPassword2] = useState('');
  const [showPw,     setShowPw]    = useState(false);
  const [loading,    setLoading]   = useState(false);
  const [error,      setError]     = useState('');
  const [success,    setSuccess]   = useState('');

  const reset = (nextMode: Mode) => {
    setMode(nextMode); setError(''); setSuccess('');
    setUsername(''); setDisplayName(''); setPassword(''); setPassword2('');
  };

  // ── ĐĂNG NHẬP ────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');

    const email = username.trim().toLowerCase() + DOMAIN;
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !data.user) {
      setError('Tên đăng nhập hoặc mật khẩu không đúng');
      setLoading(false); return;
    }

    const { data: profile } = await supabase
      .from('users').select('id, name, role').eq('id', data.user.id).single();

    if (profile) {
      login({ id: profile.id, name: profile.name, role: profile.role });
    } else {
      login({ id: data.user.id, name: username.trim(), role: 'staff' });
    }
    setLoading(false);
  };

  // ── ĐĂNG KÝ ──────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (password !== password2) { setError('Mật khẩu xác nhận không khớp'); return; }
    if (password.length < 6)    { setError('Mật khẩu phải có ít nhất 6 ký tự'); return; }
    if (username.trim().length < 2) { setError('Tên đăng nhập phải có ít nhất 2 ký tự'); return; }

    setLoading(true);
    const email = username.trim().toLowerCase() + DOMAIN;

    // Tạo tài khoản Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      setError(
        signUpError.message.includes('already registered')
          ? 'Tên đăng nhập này đã được dùng'
          : signUpError.message
      );
      setLoading(false); return;
    }

    if (data.user) {
      const name = displayName.trim() || username.trim();
      // Trigger on_auth_user_created tự tạo users + staff_members với username
      // Nếu user nhập tên hiển thị riêng thì update lại
      await supabase.from('users').update({ name }).eq('id', data.user.id);
      await supabase.from('staff_members').update({ name }).eq('user_id', data.user.id);
    }

    setSuccess('Đăng ký thành công! Bạn có thể đăng nhập ngay.');
    setLoading(false);
    setTimeout(() => reset('login'), 2000);
  };

  return (
    <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col items-center justify-center p-8">
      {/* Logo */}
      <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-inner">
        <Lock size={40} strokeWidth={1.5} />
      </div>
      <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
        FestManager
      </h1>
      <p className="text-gray-400 mb-8 text-sm">Hệ thống quản lý F&amp;B lưu động</p>

      {/* Tab login / register */}
      <div className="flex w-full bg-gray-100 rounded-xl p-1 mb-6">
        <button
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${mode === 'login' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
          onClick={() => reset('login')}
        >Đăng nhập</button>
        <button
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${mode === 'register' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
          onClick={() => reset('register')}
        >Đăng ký</button>
      </div>

      {/* ── FORM ĐĂNG NHẬP ── */}
      {mode === 'login' && (
        <form onSubmit={handleLogin} className="w-full space-y-4">
          <Field label="Tên đăng nhập" icon={<User size={16} />}>
            <input type="text" required autoComplete="username"
              value={username} onChange={e => setUsername(e.target.value)}
              className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </Field>

          <Field label="Mật khẩu" icon={<Lock size={16} />}>
            <input type={showPw ? 'text' : 'password'} required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full pl-9 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </Field>

          {error && <ErrorMsg msg={error} />}

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:opacity-90 disabled:opacity-60 transition">
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      )}

      {/* ── FORM ĐĂNG KÝ ── */}
      {mode === 'register' && (
        <form onSubmit={handleRegister} className="w-full space-y-4">
          <Field label="Tên đăng nhập" icon={<User size={16} />}>
            <input type="text" required
              value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
              className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </Field>

          <Field label="Tên hiển thị" icon={<User size={16} />}>
            <input type="text"
              value={displayName} onChange={e => setDisplayName(e.target.value)}
              className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </Field>

          <Field label="Mật khẩu" icon={<Lock size={16} />}>
            <input type={showPw ? 'text' : 'password'} required
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full pl-9 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </Field>

          <Field label="Xác nhận mật khẩu" icon={<Lock size={16} />}>
            <input type="password" required
              value={password2} onChange={e => setPassword2(e.target.value)}
              className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </Field>

          {error   && <ErrorMsg msg={error} />}
          {success && (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 text-sm">
              <CheckCircle size={15} className="shrink-0" /> {success}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:opacity-90 disabled:opacity-60 transition">
            {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </button>
        </form>
      )}
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        {children}
      </div>
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-sm">
      <AlertCircle size={15} className="shrink-0" /> {msg}
    </div>
  );
}
