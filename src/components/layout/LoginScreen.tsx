import { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle, CheckCircle, Download, Smartphone, X, ShieldCheck, Store, Tent, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '../../lib/supabase';
import { adminApi } from '../../lib/adminApi';
import { useApp } from '../../context/AppContext';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

const DOMAIN = '@fm.com';

type Mode           = 'login' | 'register';
type RegisterRole   = 'staff' | 'manager';

export default function LoginScreen() {
  const { login }  = useApp();
  const { isIos, isStandalone, triggerInstall } = useInstallPrompt();

  const [showInstallModal, setShowInstallModal] = useState(false);
  const [mode,           setMode]         = useState<Mode>('login');
  const [username,       setUsername]     = useState('');
  const [displayName,    setDisplayName]  = useState('');
  const [password,       setPassword]     = useState('');
  const [password2,      setPassword2]    = useState('');
  const [registerRole,   setRegisterRole] = useState<RegisterRole>('staff');
  const [registerDept,   setRegisterDept] = useState<'restaurant' | 'festival'>('restaurant');
  const [showPw,         setShowPw]       = useState(false);
  const [loading,        setLoading]      = useState(false);
  const [error,          setError]        = useState('');
  const [success,        setSuccess]      = useState('');

  const reset = (nextMode: Mode) => {
    setMode(nextMode); setError(''); setSuccess('');
    setUsername(''); setDisplayName(''); setPassword(''); setPassword2('');
    setRegisterRole('staff'); setRegisterDept('restaurant');
  };

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
      .from('users').select('id, name, role, status, department').eq('id', data.user.id).single();

    if (profile) {
      if (profile.status === 'pending') {
        await supabase.auth.signOut();
        setError('Tài khoản quản lý đang chờ admin duyệt. Vui lòng liên hệ admin.');
        setLoading(false); return;
      }
      if (profile.status === 'rejected') {
        await supabase.auth.signOut();
        setError('Yêu cầu đăng ký quản lý đã bị từ chối. Vui lòng liên hệ admin.');
        setLoading(false); return;
      }
      login({ id: profile.id, name: profile.name, role: profile.role, department: profile.department ?? null });
    } else {
      await supabase.auth.signOut();
      setError('Không tìm thấy tài khoản. Vui lòng liên hệ admin.');
      setLoading(false); return;
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (password !== password2)          { setError('Mật khẩu xác nhận không khớp'); return; }
    if (password.length < 6)             { setError('Mật khẩu phải có ít nhất 6 ký tự'); return; }
    if (username.trim().length < 2)      { setError('Tên đăng nhập phải có ít nhất 2 ký tự'); return; }

    setLoading(true);
    const email = username.trim().toLowerCase() + DOMAIN;
    const name  = displayName.trim() || username.trim();

    const { error: createError } = await adminApi.register({
      email, password, name, role: registerRole,
      ...(registerRole === 'staff' ? { department: registerDept } : {}),
    });

    if (createError) {
      setError(
        createError.toLowerCase().includes('already been registered') ||
        createError.toLowerCase().includes('already exists')
          ? 'Tên đăng nhập này đã được dùng'
          : createError
      );
      setLoading(false); return;
    }

    if (registerRole === 'staff') {
      setSuccess('Đăng ký thành công! Bạn có thể đăng nhập ngay.');
      setTimeout(() => reset('login'), 2000);
    } else {
      setSuccess('Yêu cầu đăng ký quản lý đã được gửi! Admin sẽ duyệt sớm.');
      setTimeout(() => reset('login'), 3000);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!showInstallModal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowInstallModal(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showInstallModal]);

  const handleInstallClick = async () => {
    const result = await triggerInstall();
    if (result === 'guide' || result === 'already') setShowInstallModal(v => !v);
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-slate-50">

      {/* Card */}
      <div className="w-full bg-white rounded-3xl p-8 shadow-warm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center mb-3 shadow-hero">
            <UtensilsCrossed size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">FestManager</h1>
          <p className="text-brand-400 text-sm mt-0.5">Hệ thống quản lý F&amp;B lưu động</p>
        </div>

        {/* Tab */}
        <div className="flex w-full bg-brand-50 rounded-xl p-1 mb-6">
          {(['login', 'register'] as Mode[]).map(m => (
            <Button
              key={m}
              type="button"
              onClick={() => reset(m)}
              variant={mode === m ? 'default' : 'ghost'}
              size="sm"
              className={`flex-1 text-sm font-semibold rounded-lg transition-all ${
                mode === m
                  ? 'bg-white shadow text-brand-600'
                  : 'text-slate-400'
              }`}
            >
              {m === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </Button>
          ))}
        </div>

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="w-full space-y-4">
            <Field label="Tên đăng nhập">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none"><User size={16} /></span>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="Nhập tên đăng nhập"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 border border-brand-200 rounded-xl text-sm text-slate-800 bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 placeholder:text-slate-300 transition-all"
                />
              </div>
            </Field>

            <Field label="Mật khẩu">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none"><Lock size={16} /></span>
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-3 border border-brand-200 rounded-xl text-sm text-slate-800 bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 placeholder:text-slate-300 transition-all"
                />
                <button type="button" aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-brand-500">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {error && <ErrorMsg msg={error} />}

            <Button
              type="submit"
              loading={loading}
              fullWidth
              className="w-full bg-brand-gradient hover:opacity-90 text-white font-semibold py-3 rounded-xl shadow-warm active:scale-[0.98] transition-all"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>
        )}

        {/* ── REGISTER ── */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="w-full space-y-4">
            <div className="bg-brand-50 border border-brand-200 rounded-xl px-3 py-2.5 text-xs text-brand-600">
              💡 Nếu admin đã tạo tài khoản cho bạn, hãy dùng thông tin do admin cung cấp.
            </div>

            {/* Role */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Đăng ký với vai trò</label>
              <div className="grid grid-cols-2 gap-2">
                <RoleBtn
                  active={registerRole === 'staff'}
                  activeClass="bg-brand-gradient text-white shadow-warm"
                  onClick={() => setRegisterRole('staff')}
                  icon={<User size={14} />}
                  label="Nhân viên"
                />
                <RoleBtn
                  active={registerRole === 'manager'}
                  activeClass="bg-indigo-500 text-white shadow-[0_2px_8px_0_rgb(99_102_241/0.35)]"
                  onClick={() => setRegisterRole('manager')}
                  icon={<ShieldCheck size={14} />}
                  label="Quản lý"
                />
              </div>
              {registerRole === 'manager' && (
                <p className="mt-1.5 text-xs text-indigo-600">
                  ⏳ Tài khoản quản lý cần được admin duyệt trước khi đăng nhập.
                </p>
              )}
            </div>

            {/* Department */}
            {registerRole === 'staff' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Bộ phận</label>
                <div className="grid grid-cols-2 gap-2">
                  <RoleBtn
                    active={registerDept === 'restaurant'}
                    activeClass="bg-brand-gradient text-white shadow-warm"
                    onClick={() => setRegisterDept('restaurant')}
                    icon={<Store size={14} />}
                    label="Nhà hàng"
                  />
                  <RoleBtn
                    active={registerDept === 'festival'}
                    activeClass="bg-herb-500 text-white shadow-[0_2px_8px_0_rgb(34_197_94/0.35)]"
                    onClick={() => setRegisterDept('festival')}
                    icon={<Tent size={14} />}
                    label="Festival"
                  />
                </div>
              </div>
            )}

            <Field label="Tên đăng nhập">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none"><User size={16} /></span>
                <input
                  type="text"
                  required
                  placeholder="Không dấu, không khoảng trắng"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                  className="w-full pl-9 pr-4 py-3 border border-brand-200 rounded-xl text-sm text-slate-800 bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 placeholder:text-slate-300 transition-all"
                />
              </div>
            </Field>

            <Field label="Tên hiển thị">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none"><User size={16} /></span>
                <input
                  type="text"
                  placeholder="Tên đầy đủ của bạn"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 border border-brand-200 rounded-xl text-sm text-slate-800 bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 placeholder:text-slate-300 transition-all"
                />
              </div>
            </Field>

            <Field label="Mật khẩu">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none"><Lock size={16} /></span>
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-3 border border-brand-200 rounded-xl text-sm text-slate-800 bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 placeholder:text-slate-300 transition-all"
                />
                <button type="button" aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-brand-500">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <Field label="Xác nhận mật khẩu">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none"><Lock size={16} /></span>
                <input
                  type="password"
                  required
                  placeholder="Nhập lại mật khẩu"
                  value={password2}
                  onChange={e => setPassword2(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 border border-brand-200 rounded-xl text-sm text-slate-800 bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 placeholder:text-slate-300 transition-all"
                />
              </div>
            </Field>

            {error   && <ErrorMsg msg={error} />}
            {success && (
              <div className="flex items-center gap-2 text-herb-600 bg-herb-500/10 border border-herb-500/30 rounded-xl px-3 py-2.5 text-sm">
                <CheckCircle size={15} className="shrink-0" /> {success}
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              fullWidth
              className={`w-full text-white font-semibold py-3 rounded-xl shadow-warm active:scale-[0.98] transition-all ${
                registerRole === 'manager' ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-brand-gradient hover:opacity-90'
              }`}
            >
              {loading ? 'Đang xử lý...' : registerRole === 'manager' ? 'Gửi yêu cầu đăng ký' : 'Tạo tài khoản'}
            </Button>
          </form>
        )}

        {/* Footer */}
        <div className="border-t border-slate-100 mt-6 pt-4 flex items-center justify-center gap-3">
          <div className="relative">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-600 text-xs font-medium transition-colors"
            >
              <Download size={14} /> Cài đặt app
            </button>
            {showInstallModal && (
              <div className="absolute bottom-11 right-0 w-72 bg-white rounded-2xl shadow-warm border border-slate-100 z-50 p-4 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Smartphone size={16} className="text-brand-500" />
                    <p className="text-sm font-semibold text-slate-800">
                      {isStandalone ? 'Đã cài đặt' : 'Cài FestManager'}
                    </p>
                  </div>
                  <button onClick={() => setShowInstallModal(false)} className="text-slate-300 hover:text-slate-500"><X size={15} /></button>
                </div>
                {isStandalone ? (
                  <p className="text-sm text-brand-500">FestManager đã được cài 🎉</p>
                ) : isIos ? (
                  <div className="space-y-2.5">
                    <InstallStep n={1} text='Bấm nút Chia sẻ ↑ ở thanh dưới Safari' />
                    <InstallStep n={2} text='Cuộn xuống → chọn "Thêm vào màn hình chính"' />
                    <InstallStep n={3} text='Bấm "Thêm" góc trên phải' />
                  </div>
                ) : (
                  <p className="text-sm text-brand-400">Dùng menu trình duyệt → "Cài đặt ứng dụng".</p>
                )}
                <p className="text-xs text-slate-400 mt-3">Yêu cầu Safari iOS 16.4+ hoặc Chrome Android</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-700 mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function RoleBtn({ active, activeClass, onClick, icon, label }: {
  active: boolean; activeClass: string; onClick: () => void;
  icon: React.ReactNode; label: string;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant={active ? 'default' : 'outline'}
      size="sm"
      className={`py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-[0.97] ${
        active
          ? `${activeClass} border-transparent`
          : 'bg-white text-brand-500 border-brand-200 hover:border-brand-400'
      }`}
    >
      {icon} {label}
    </Button>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm">
      <AlertCircle size={15} className="shrink-0" /> {msg}
    </div>
  );
}

function InstallStep({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-2.5 items-start">
      <span className="w-5 h-5 rounded-full bg-brand-gradient text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
      <p className="text-xs text-slate-700 leading-snug">{text}</p>
    </div>
  );
}
