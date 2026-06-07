import { useState } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle, CheckCircle, Moon, Sun, Download, Smartphone, X, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

const DOMAIN = '@festmanager.com';

type Mode = 'login' | 'register';
type RegisterRole = 'staff' | 'manager';

export default function LoginScreen() {
  const { login } = useApp();
  const { theme, toggleTheme } = useTheme();
  const { isIos, isStandalone, triggerInstall } = useInstallPrompt();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [mode,           setMode]         = useState<Mode>('login');
  const [username,       setUsername]     = useState('');
  const [displayName,    setDisplayName]  = useState('');
  const [password,       setPassword]     = useState('');
  const [password2,      setPassword2]    = useState('');
  const [registerRole,   setRegisterRole] = useState<RegisterRole>('staff');
  const [showPw,         setShowPw]       = useState(false);
  const [loading,        setLoading]      = useState(false);
  const [error,          setError]        = useState('');
  const [success,        setSuccess]      = useState('');

  const reset = (nextMode: Mode) => {
    setMode(nextMode); setError(''); setSuccess('');
    setUsername(''); setDisplayName(''); setPassword(''); setPassword2('');
    setRegisterRole('staff');
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
      .from('users').select('id, name, role, status').eq('id', data.user.id).single();

    if (profile) {
      if (profile.status === 'pending') {
        await supabase.auth.signOut();
        setError('Tài khoản quản lý của bạn đang chờ admin duyệt. Vui lòng liên hệ admin.');
        setLoading(false); return;
      }
      if (profile.status === 'rejected') {
        await supabase.auth.signOut();
        setError('Yêu cầu đăng ký quản lý của bạn đã bị từ chối. Vui lòng liên hệ admin.');
        setLoading(false); return;
      }
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
      const status = registerRole === 'manager' ? 'pending' : 'active';

      await supabase.from('users').upsert({
        id: data.user.id,
        name,
        role: registerRole,
        status,
      });

      if (registerRole === 'staff') {
        await supabase.from('staff_members').update({ name }).eq('user_id', data.user.id);
        setSuccess('Đăng ký thành công! Bạn có thể đăng nhập ngay.');
        setTimeout(() => reset('login'), 2000);
      } else {
        // Manager: sign out immediately, wait for admin approval
        await supabase.auth.signOut();
        setSuccess('Yêu cầu đăng ký quản lý đã được gửi! Admin sẽ duyệt tài khoản của bạn.');
        setTimeout(() => reset('login'), 3000);
      }
    }

    setLoading(false);
  };

  const handleInstallClick = async () => {
    const result = await triggerInstall();
    if (result === 'guide' || result === 'already') setShowInstallModal(v => !v);
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center justify-center min-h-screen px-4 py-8">

      {/* Card */}
      <div className="w-full bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl">
        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <span className="text-white font-black text-xl tracking-tight">FM</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">FestManager</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">Hệ thống quản lý F&amp;B lưu động</p>
        </div>

        {/* Tab login / register */}
        <div className="flex w-full bg-gray-100 dark:bg-slate-700 rounded-xl p-1 mb-6">
          <button
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${mode === 'login' ? 'bg-white dark:bg-slate-600 shadow text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => reset('login')}
          >Đăng nhập</button>
          <button
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${mode === 'register' ? 'bg-white dark:bg-slate-600 shadow text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => reset('register')}
          >Đăng ký</button>
        </div>

        {/* ── FORM ĐĂNG NHẬP ── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="w-full space-y-4">
            <Field label="Tên đăng nhập" icon={<User size={16} />}>
              <input type="text" required autoComplete="username" placeholder="Nhập tên đăng nhập"
                value={username} onChange={e => setUsername(e.target.value)}
                className="w-full pl-9 pr-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-500 rounded-xl text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all" />
            </Field>

            <Field label="Mật khẩu" icon={<Lock size={16} />}>
              <input type={showPw ? 'text' : 'password'} required autoComplete="current-password" placeholder="Nhập mật khẩu"
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-500 rounded-xl text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </Field>

            {error && <ErrorMsg msg={error} />}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-md disabled:opacity-60 transition-colors">
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        )}

        {/* ── FORM ĐĂNG KÝ ── */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="w-full space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-xs text-blue-700">
              💡 Nếu admin đã tạo tài khoản cho bạn, hãy dùng thông tin đăng nhập do admin cung cấp thay vì đăng ký mới.
            </div>

            {/* Role selection */}
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 block">Đăng ký với vai trò</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegisterRole('staff')}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                    registerRole === 'staff'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600'
                  }`}
                >
                  <User size={14} /> Nhân viên
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterRole('manager')}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                    registerRole === 'manager'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600'
                  }`}
                >
                  <ShieldCheck size={14} /> Quản lý
                </button>
              </div>
              {registerRole === 'manager' && (
                <p className="mt-1.5 text-xs text-indigo-600 dark:text-indigo-400">
                  ⏳ Tài khoản quản lý cần được admin duyệt trước khi đăng nhập.
                </p>
              )}
            </div>

            <Field label="Tên đăng nhập" icon={<User size={16} />}>
              <input type="text" required placeholder="Không dấu, không khoảng trắng"
                value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                className="w-full pl-9 pr-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-500 rounded-xl text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all" />
            </Field>

            <Field label="Tên hiển thị" icon={<User size={16} />}>
              <input type="text" placeholder="Tên đầy đủ của bạn"
                value={displayName} onChange={e => setDisplayName(e.target.value)}
                className="w-full pl-9 pr-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-500 rounded-xl text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all" />
            </Field>

            <Field label="Mật khẩu" icon={<Lock size={16} />}>
              <input type={showPw ? 'text' : 'password'} required placeholder="Tối thiểu 6 ký tự"
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-500 rounded-xl text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </Field>

            <Field label="Xác nhận mật khẩu" icon={<Lock size={16} />}>
              <input type="password" required placeholder="Nhập lại mật khẩu"
                value={password2} onChange={e => setPassword2(e.target.value)}
                className="w-full pl-9 pr-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-500 rounded-xl text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all" />
            </Field>

            {error   && <ErrorMsg msg={error} />}
            {success && (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 text-sm">
                <CheckCircle size={15} className="shrink-0" /> {success}
              </div>
            )}

            <button type="submit" disabled={loading}
              className={`w-full text-white font-semibold py-3 rounded-xl shadow-md disabled:opacity-60 transition-colors ${
                registerRole === 'manager'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}>
              {loading ? 'Đang xử lý...' : registerRole === 'manager' ? 'Gửi yêu cầu đăng ký' : 'Tạo tài khoản'}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="border-t border-gray-100 dark:border-slate-700 mt-6 pt-4 flex items-center justify-center gap-3">
          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 text-xs font-medium transition-colors"
            title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
          </button>

          {/* Install app */}
          <div className="relative">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 text-xs font-medium transition-colors"
              title="Cài đặt ứng dụng"
            >
              <Download size={14} />
              Cài đặt app
            </button>
            {showInstallModal && (
              <div className="absolute bottom-11 right-0 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 z-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Smartphone size={16} className="text-indigo-600" />
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {isStandalone ? 'Đã cài đặt' : 'Cài đặt FestManager'}
                    </p>
                  </div>
                  <button onClick={() => setShowInstallModal(false)} className="text-gray-400"><X size={15} /></button>
                </div>
                {isStandalone ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300">FestManager đã được cài trên thiết bị của bạn. 🎉</p>
                    <div className="pt-1 space-y-2">
                      <InstallStep n={1} text='Bấm nút Chia sẻ ↑ ở thanh dưới Safari' />
                      <InstallStep n={2} text='Cuộn xuống → chọn "Thêm vào màn hình chính"' />
                      <InstallStep n={3} text='Bấm "Thêm" góc trên phải' />
                    </div>
                  </div>
                ) : isIos ? (
                  <div className="space-y-2.5">
                    <InstallStep n={1} text='Bấm nút Chia sẻ ↑ ở thanh dưới Safari' />
                    <InstallStep n={2} text='Cuộn xuống → chọn "Thêm vào màn hình chính"' />
                    <InstallStep n={3} text='Bấm "Thêm" góc trên phải' />
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Trình duyệt của bạn không hỗ trợ cài đặt tự động. Dùng menu trình duyệt → "Cài đặt ứng dụng".
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-3">Yêu cầu Safari iOS 16.4+ hoặc Chrome Android</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">{label}</label>
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

function InstallStep({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-2.5 items-start">
      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
      <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">{text}</p>
    </div>
  );
}
