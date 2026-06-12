import { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle, CheckCircle, Download, Smartphone, X, ShieldCheck, Store, Tent, UtensilsCrossed, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabList, Tab, TabIndicator } from '@heroui/react';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { adminApi } from '../../lib/adminApi';
import { useApp } from '../../context/AppContext';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

const DOMAIN = '@fm.com';

type Mode           = 'login' | 'register';
type RegisterRole   = 'staff' | 'manager';

export default function LoginScreen() {
  const { login }  = useApp();
  const { theme, toggleTheme } = useTheme();
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
    <div className="w-full max-w-md flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-[var(--background)]">

      {/* Card */}
      <div className="w-full glass-card rounded-3xl p-8 shadow-[var(--shadow-hero)]">

        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-16 h-16 rounded-2xl bg-[var(--primary)] flex items-center justify-center mb-3 shadow-[var(--shadow-hero)]">
            <UtensilsCrossed size={28} className="text-[var(--background)]" />
          </div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">FestManager</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Hệ thống quản lý F&amp;B lưu động</p>
        </div>

        {/* Tab */}
        <Tabs
          selectedKey={mode}
          onSelectionChange={(key) => reset(key as Mode)}
          className="mb-6 w-full"
        >
          <TabList className="relative flex w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-1">
            <TabIndicator className="absolute inset-y-1 rounded-lg bg-[var(--card)] shadow-[var(--shadow-card)]" />
            {(['login', 'register'] as Mode[]).map(m => (
              <Tab
                key={m}
                id={m}
                className="relative z-10 flex-1 cursor-pointer rounded-lg py-2 text-center text-sm font-semibold outline-none transition-colors text-[var(--text-muted)] data-[hovered]:text-[var(--text-secondary)] data-[selected]:text-[var(--text-primary)]"
              >
                {m === 'login' ? 'Đăng nhập' : 'Đăng ký'}
              </Tab>
            ))}
          </TabList>
        </Tabs>

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="w-full space-y-4">
            <Input
              label="Tên đăng nhập"
              value={username}
              onChange={setUsername}
              placeholder="Nhập tên đăng nhập"
              autoComplete="username"
              startContent={<User size={16} />}
            />

            <Input
              label="Mật khẩu"
              value={password}
              onChange={setPassword}
              type={showPw ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
              startContent={<Lock size={16} />}
              endContent={
                <button
                  type="button"
                  aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowPw(v => !v)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            {error && <AlertBox msg={error} />}

            <Button
              type="submit"
              loading={loading}
              fullWidth
              className="w-full bg-[var(--primary)] text-[var(--background)] font-semibold py-3 rounded-xl active:scale-[0.98] transition-all hover:opacity-90"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>
        )}

        {/* ── REGISTER ── */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="w-full space-y-4">
            <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-3 py-2.5 text-xs text-[var(--text-secondary)]">
              💡 Nếu admin đã tạo tài khoản cho bạn, hãy dùng thông tin do admin cung cấp.
            </div>

            {/* Role */}
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 block">Đăng ký với vai trò</label>
              <div className="grid grid-cols-2 gap-2">
                <RoleBtn
                  active={registerRole === 'staff'}
                  onPress={() => setRegisterRole('staff')}
                  icon={<User size={14} />}
                  label="Nhân viên"
                />
                <RoleBtn
                  active={registerRole === 'manager'}
                  onPress={() => setRegisterRole('manager')}
                  icon={<ShieldCheck size={14} />}
                  label="Quản lý"
                  activeColor="indigo"
                />
              </div>
              {registerRole === 'manager' && (
                <p className="mt-1.5 text-xs text-indigo-400">
                  ⏳ Tài khoản quản lý cần được admin duyệt trước khi đăng nhập.
                </p>
              )}
            </div>

            {/* Department */}
            {registerRole === 'staff' && (
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 block">Bộ phận</label>
                <div className="grid grid-cols-2 gap-2">
                  <RoleBtn
                    active={registerDept === 'restaurant'}
                    onPress={() => setRegisterDept('restaurant')}
                    icon={<Store size={14} />}
                    label="Nhà hàng"
                  />
                  <RoleBtn
                    active={registerDept === 'festival'}
                    onPress={() => setRegisterDept('festival')}
                    icon={<Tent size={14} />}
                    label="Festival"
                    activeColor="success"
                  />
                </div>
              </div>
            )}

            <Input
              label="Tên đăng nhập"
              value={username}
              onChange={val => setUsername(val.replace(/\s/g, ''))}
              placeholder="Không dấu, không khoảng trắng"
              startContent={<User size={16} />}
            />

            <Input
              label="Tên hiển thị"
              value={displayName}
              onChange={setDisplayName}
              placeholder="Tên đầy đủ của bạn"
              startContent={<User size={16} />}
            />

            <Input
              label="Mật khẩu"
              value={password}
              onChange={setPassword}
              type={showPw ? 'text' : 'password'}
              placeholder="Tối thiểu 6 ký tự"
              startContent={<Lock size={16} />}
              endContent={
                <button
                  type="button"
                  aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowPw(v => !v)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <Input
              label="Xác nhận mật khẩu"
              value={password2}
              onChange={setPassword2}
              type="password"
              placeholder="Nhập lại mật khẩu"
              startContent={<Lock size={16} />}
            />

            {error   && <AlertBox msg={error} />}
            {success && (
              <div className="flex items-center gap-2 bg-[var(--success-light)] border border-[var(--success)]/30 rounded-xl px-3 py-2.5 text-sm text-[var(--success)]">
                <CheckCircle size={15} className="shrink-0" /> {success}
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              fullWidth
              className={`w-full font-semibold py-3 rounded-xl active:scale-[0.98] transition-all hover:opacity-90 ${
                registerRole === 'manager'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-[var(--primary)] text-[var(--background)]'
              }`}
            >
              {loading ? 'Đang xử lý...' : registerRole === 'manager' ? 'Gửi yêu cầu đăng ký' : 'Tạo tài khoản'}
            </Button>
          </form>
        )}

        {/* Footer */}
        <div className="border-t border-[var(--glass-border)] mt-6 pt-4 flex items-center justify-center gap-3">
          <div className="relative">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--glass-bg)] hover:bg-[var(--muted)] border border-[var(--glass-border)] text-[var(--text-secondary)] text-xs font-medium transition-colors"
            >
              <Download size={14} /> Cài đặt app
            </button>
            {showInstallModal && (
              <div className="absolute bottom-11 right-0 w-72 glass-card rounded-2xl shadow-[var(--shadow-warm)] z-50 p-4 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Smartphone size={16} className="text-[var(--text-secondary)]" />
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {isStandalone ? 'Đã cài đặt' : 'Cài FestManager'}
                    </p>
                  </div>
                  <button onClick={() => setShowInstallModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"><X size={15} /></button>
                </div>
                {isStandalone ? (
                  <p className="text-sm text-[var(--text-secondary)]">FestManager đã được cài 🎉</p>
                ) : isIos ? (
                  <div className="space-y-2.5">
                    <InstallStep n={1} text='Bấm nút Chia sẻ ↑ ở thanh dưới Safari' />
                    <InstallStep n={2} text='Cuộn xuống → chọn "Thêm vào màn hình chính"' />
                    <InstallStep n={3} text='Bấm "Thêm" góc trên phải' />
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">Dùng menu trình duyệt → "Cài đặt ứng dụng".</p>
                )}
                <p className="text-xs text-[var(--text-muted)] mt-3">Yêu cầu Safari iOS 16.4+ hoặc Chrome Android</p>
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--glass-bg)] hover:bg-[var(--muted)] border border-[var(--glass-border)] text-[var(--text-secondary)] text-xs font-medium transition-colors"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Sáng' : 'Tối'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function RoleBtn({ active, onPress, icon, label, activeColor = 'primary' }: {
  active: boolean;
  onPress: () => void;
  icon: React.ReactNode;
  label: string;
  activeColor?: 'primary' | 'indigo' | 'success';
}) {
  const activeStyles: Record<string, string> = {
    primary: 'bg-[var(--primary)] text-[var(--background)] border-[var(--primary)]',
    indigo:  'bg-indigo-500 text-white border-indigo-500',
    success: 'bg-[var(--success)] text-white border-[var(--success)]',
  };

  return (
    <button
      type="button"
      onClick={onPress}
      className={`py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-[0.97] border ${
        active
          ? activeStyles[activeColor]
          : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] border-[var(--glass-border)] hover:border-[var(--primary)]/40 hover:text-[var(--text-primary)]'
      }`}
    >
      {icon} {label}
    </button>
  );
}

function AlertBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 bg-[var(--danger-light)] border border-[var(--danger)]/30 rounded-xl px-3 py-2.5 text-sm text-[var(--danger)]">
      <AlertCircle size={15} className="shrink-0" /> {msg}
    </div>
  );
}

function InstallStep({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-2.5 items-start">
      <span className="w-5 h-5 rounded-full bg-[var(--primary)] text-[var(--background)] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
      <p className="text-xs text-[var(--text-secondary)] leading-snug">{text}</p>
    </div>
  );
}
