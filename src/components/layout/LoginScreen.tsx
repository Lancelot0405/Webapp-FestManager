import { useState, useEffect } from 'react';
import { User, Eye, EyeOff, Download, Smartphone, X, ShieldCheck, Store, Tent, UtensilsCrossed, Sun, Moon } from 'lucide-react';
import { Alert, Button, Card, Form, Link, TextField, Label, Input } from '@heroui/react';
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
      login({ id: profile.id, name: profile.name, role: profile.role as import('../../types').UserRole, department: (profile.department ?? null) as import('../../types').UserDepartment | null });
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
    <div className="w-full max-w-md flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-background">
      {/* Branding above the card */}
      <div className="flex flex-col items-center mb-6 text-center select-none">
        <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center shadow-lg mb-3 shrink-0">
          <UtensilsCrossed size={22} className="text-white dark:text-foreground" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">FestManager</h1>
        <p className="text-xs text-muted mt-1">Hệ thống quản lý F&amp;B lưu động</p>
      </div>

      {/* Card */}
      <Card className="w-full">
        <Card.Header className="flex flex-col items-start gap-1 p-6">
          <Card.Title className="text-xl font-bold text-foreground">
            {mode === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'}
          </Card.Title>
          <Card.Description className="text-sm text-muted">
            {mode === 'login' 
              ? 'Nhập thông tin tài khoản để truy cập hệ thống' 
              : 'Tạo tài khoản mới để bắt đầu sử dụng'}
          </Card.Description>
        </Card.Header>

        <Card.Content className="flex flex-col gap-4 py-2 px-6">
          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <Form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
              <TextField name="username" type="text" isRequired value={username} onChange={setUsername} className="w-full flex flex-col gap-1">
                <Label>Tên đăng nhập</Label>
                <Input placeholder="Nhập tên đăng nhập" variant="secondary" autoComplete="username" className="w-full" />
              </TextField>

              <TextField name="password" type={showPw ? 'text' : 'password'} isRequired value={password} onChange={setPassword} className="w-full flex flex-col gap-1">
                <Label>Mật khẩu</Label>
                <div className="relative flex items-center w-full">
                  <Input placeholder="Nhập mật khẩu" variant="secondary" autoComplete="current-password" className="w-full pr-10" />
                  <Button
                    isIconOnly
                    variant="ghost"
                    aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    onPress={() => setShowPw(v => !v)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 min-w-0 p-0 bg-transparent text-muted hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </TextField>

              {error && <AlertBox msg={error} />}

              <Button
                type="submit"
                isDisabled={loading}
                className="w-full mt-2"
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </Form>
          )}

          {/* ── REGISTER ── */}
          {mode === 'register' && (
            <Form onSubmit={handleRegister} className="w-full flex flex-col gap-4">
              <div className="bg-default/40 border border-separator rounded-xl px-3 py-2.5 text-xs text-foreground/80">
                💡 Nếu admin đã tạo tài khoản cho bạn, hãy dùng thông tin do admin cung cấp.
              </div>

              {/* Role */}
              <div className="flex flex-col gap-1">
                <Label>Đăng ký với vai trò</Label>
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
                  <p className="mt-1 text-xs text-indigo-400">
                    ⏳ Tài khoản quản lý cần được admin duyệt trước khi đăng nhập.
                  </p>
                )}
              </div>

              {/* Department */}
              {registerRole === 'staff' && (
                <div className="flex flex-col gap-1">
                  <Label>Bộ phận</Label>
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

              <TextField name="username" type="text" isRequired value={username} onChange={val => setUsername(val.replace(/\s/g, ''))} className="w-full flex flex-col gap-1">
                <Label>Tên đăng nhập</Label>
                <Input placeholder="Không dấu, không khoảng trắng" variant="secondary" className="w-full" />
              </TextField>

              <TextField name="displayName" type="text" isRequired value={displayName} onChange={setDisplayName} className="w-full flex flex-col gap-1">
                <Label>Tên hiển thị</Label>
                <Input placeholder="Tên đầy đủ của bạn" variant="secondary" className="w-full" />
              </TextField>

              <TextField name="password" type={showPw ? 'text' : 'password'} isRequired value={password} onChange={setPassword} className="w-full flex flex-col gap-1">
                <Label>Mật khẩu</Label>
                <div className="relative flex items-center w-full">
                  <Input placeholder="Tối thiểu 6 ký tự" variant="secondary" className="w-full pr-10" />
                  <Button
                    isIconOnly
                    variant="ghost"
                    aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    onPress={() => setShowPw(v => !v)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 min-w-0 p-0 bg-transparent text-muted hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </TextField>

              <TextField name="password2" type="password" isRequired value={password2} onChange={setPassword2} className="w-full flex flex-col gap-1">
                <Label>Xác nhận mật khẩu</Label>
                <Input placeholder="Nhập lại mật khẩu" variant="secondary" className="w-full" />
              </TextField>

              {error   && <AlertBox msg={error} />}
              {success && (
                <Alert status="success">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Description>{success}</Alert.Description>
                  </Alert.Content>
                </Alert>
              )}

              <Button
                type="submit"
                isDisabled={loading}
                className="w-full mt-2"
              >
                {loading ? 'Đang xử lý...' : registerRole === 'manager' ? 'Gửi yêu cầu đăng ký' : 'Tạo tài khoản'}
              </Button>
            </Form>
          )}
        </Card.Content>

        {/* Footer with navigation link */}
        <Card.Footer className="py-4 flex flex-col items-center justify-center gap-2">
          {mode === 'login' ? (
            <Link
              onPress={() => reset('register')}
              className="cursor-pointer text-sm text-center font-medium"
            >
              Chưa có tài khoản? Đăng ký ngay
            </Link>
          ) : (
            <Link
              onPress={() => reset('login')}
              className="cursor-pointer text-sm text-center font-medium"
            >
              Đã có tài khoản? Đăng nhập
            </Link>
          )}
        </Card.Footer>
      </Card>

      {/* Utilities outside the card */}
      <div className="w-full flex items-center justify-center gap-3 mt-6">
        <div className="relative">
          <Button
            variant="ghost"
            onPress={handleInstallClick}
            className="h-auto min-w-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-default/50 hover:bg-default border border-separator text-foreground/80 text-xs font-medium transition-colors"
          >
            <Download size={14} /> Cài đặt app
          </Button>
          {showInstallModal && (
            <div className="absolute bottom-11 left-1/2 -translate-x-1/2 w-72 bg-surface border border-separator rounded-2xl shadow-lg z-50 p-4 animate-fade-in text-left">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Smartphone size={16} className="text-foreground/80" />
                  <p className="text-sm font-semibold text-foreground">
                    {isStandalone ? 'Đã cài đặt' : 'Cài FestManager'}
                  </p>
                </div>
                <Button isIconOnly variant="ghost" onPress={() => setShowInstallModal(false)} aria-label="Đóng" className="h-auto min-w-0 p-0 text-muted hover:text-foreground transition-colors"><X size={15} /></Button>
              </div>
              {isStandalone ? (
                <p className="text-sm text-foreground/80">FestManager đã được cài 🎉</p>
              ) : isIos ? (
                <div className="space-y-2.5">
                  <InstallStep n={1} text='Bấm nút Chia sẻ ↑ ở thanh dưới Safari' />
                  <InstallStep n={2} text='Cuộn xuống → chọn "Thêm vào màn hình chính"' />
                  <InstallStep n={3} text='Bấm "Thêm" góc trên phải' />
                </div>
              ) : (
                <p className="text-sm text-foreground/80">Dùng menu trình duyệt → "Cài đặt ứng dụng".</p>
              )}
              <p className="text-xs text-muted mt-3">Yêu cầu Safari iOS 16.4+ hoặc Chrome Android</p>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          onPress={() => toggleTheme()}
          aria-label={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
          className="h-auto min-w-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-default/50 hover:bg-default border border-separator text-foreground/80 text-xs font-medium transition-colors"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          {theme === 'dark' ? 'Sáng' : 'Tối'}
        </Button>
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
    primary: 'bg-accent text-white dark:text-foreground border-accent',
    indigo:  'bg-indigo-500 text-white border-indigo-500',
    success: 'bg-success text-white border-[var(--success)]',
  };

  return (
    <Button
      variant="ghost"
      onPress={onPress}
      className={`w-full h-auto min-w-0 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-[0.97] border ${
        active
          ? activeStyles[activeColor]
          : 'bg-default/50 text-foreground/80 border-separator hover:border-accent/40 hover:text-foreground'
      }`}
    >
      {icon} {label}
    </Button>
  );
}

function AlertBox({ msg }: { msg: string }) {
  return (
    <Alert status="danger">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Description>{msg}</Alert.Description>
      </Alert.Content>
    </Alert>
  );
}

function InstallStep({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-2.5 items-start">
      <span className="w-5 h-5 rounded-full bg-accent text-white dark:text-foreground text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
      <p className="text-xs text-foreground/80 leading-snug">{text}</p>
    </div>
  );
}
