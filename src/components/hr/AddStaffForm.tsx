import { useState } from 'react';
import { X, ShieldCheck, Building2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { adminApi } from '../../lib/adminApi';
import { useToast } from '../../context/ToastContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { StaffMember, StaffType, UserRole, UserDepartment } from '../../types';

const DOMAIN = '@fm.com';

interface Props {
  onClose: () => void;
}

export default function AddStaffForm({ onClose }: Props) {
  const { addStaff, state: { currentUser } } = useApp();
  const showToast = useToast();
  const [name,       setName]       = useState('');
  const [dob,        setDob]        = useState('');
  const [city,       setCity]       = useState('');
  const [staffType,  setStaffType]  = useState<StaffType>('permanent');
  const [username,   setUsername]   = useState('');
  const [role,       setRole]       = useState<UserRole>('staff');
  const [department, setDepartment] = useState<UserDepartment>('restaurant');
  const [loading,    setLoading]    = useState(false);

  const isAdmin   = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim()) return;
    setLoading(true);

    const dobFormatted = dob
      ? (() => { const [yyyy, mm, dd] = dob.split('-'); return `${dd}-${mm}-${yyyy}`; })()
      : '';

    let userId: string | undefined;

    if (username.trim()) {
      const email = username.trim().toLowerCase() + DOMAIN;
      const tempPassword = 'fest1234';
      const { data, error } = await adminApi.createStaff({
        email,
        password: tempPassword,
        name: name.trim(),
        role: isAdmin ? role : 'staff',
        department,
      });
      if (error) {
        showToast(`Lỗi tạo tài khoản: ${error}`, 'error');
        setLoading(false);
        return;
      }
      userId = data?.userId;
    }

    const newStaff: StaffMember = {
      id: Date.now(),
      userId,
      name: name.trim(),
      dob: dobFormatted,
      city: city.trim(),
      staffType,
      contracts: [],
    };
    addStaff(newStaff, userId);
    showToast('Đã thêm nhân viên', 'success');
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent position="bottom" hideClose className="w-full max-w-md overflow-hidden">
        <div className="px-5 pt-5 pb-[calc(env(safe-area-inset-bottom,0px)+80px)] max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <div className="flex justify-between items-center mb-5">
            <p className="text-base font-bold text-[var(--text-primary)]">Thêm nhân viên mới</p>
            <button
              onClick={onClose}
              aria-label="Đóng"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Tên *"
              isRequired
              value={name}
              onChange={setName}
              placeholder="Nguyễn Văn A"
            />

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">
                Tên đăng nhập <span className="font-normal text-[var(--text-muted)]">(để tạo tài khoản)</span>
              </label>
              <div className="flex items-stretch border border-[var(--glass-border)] rounded-xl overflow-hidden focus-within:border-[var(--primary)]/50 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] transition-all">
                <input
                  className="flex-1 px-3 py-2.5 text-sm bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                  placeholder="nguyenvana"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                />
                <span className="px-2.5 text-xs text-[var(--text-muted)] border-l border-[var(--glass-border)] flex items-center shrink-0 font-mono">
                  @fm.com
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Mật khẩu mặc định: <span className="font-semibold text-[var(--text-primary)]">fest1234</span>
              </p>
            </div>

            {(isAdmin || isManager) && (
              <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-3 space-y-3 backdrop-blur-[var(--glass-blur)]">
                {/* Role — admin only */}
                {isAdmin && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-[var(--text-muted)]" />
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">Quyền tài khoản</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['staff', 'manager', 'admin'] as UserRole[]).map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className={`py-2 rounded-xl text-xs font-semibold border transition-colors ${
                            role === r
                              ? r === 'admin'
                                ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30'
                                : r === 'manager'
                                  ? 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30'
                                  : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30'
                              : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] border-[var(--glass-border)] hover:border-[var(--primary)]/30'
                          }`}
                        >
                          {r === 'staff' ? 'Nhân viên' : r === 'manager' ? 'Quản lý' : 'Admin'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Department — not shown when assigning admin role */}
                {(!isAdmin || role !== 'admin') && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={13} className="text-[var(--text-muted)]" />
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">Bộ phận kho hàng</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: 'restaurant' as UserDepartment, label: 'Nhà hàng' },
                        { id: 'festival'   as UserDepartment, label: 'Festival' },
                        { id: 'both'       as UserDepartment, label: 'Cả hai'  },
                      ]).map(({ id, label }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setDepartment(id)}
                          className={`py-2 rounded-xl text-xs font-semibold border transition-colors ${
                            department === id
                              ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30'
                              : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] border-[var(--glass-border)] hover:border-[var(--success)]/30'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Ngày sinh</label>
              <input
                type="date"
                className="w-full border border-[var(--glass-border)] rounded-xl px-3 py-2.5 text-sm bg-[var(--glass-bg)] text-[var(--text-primary)] backdrop-blur-[var(--glass-blur)] focus:outline-none focus:border-[var(--primary)]/50 transition-all [color-scheme:dark]"
                value={dob}
                onChange={e => setDob(e.target.value)}
              />
            </div>

            <Input
              label="Thành phố *"
              isRequired
              value={city}
              onChange={setCity}
              placeholder="Paris"
            />

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Loại nhân viên</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setStaffType('permanent')}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    staffType === 'permanent'
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30'
                      : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] border-[var(--glass-border)] hover:border-[var(--primary)]/30'
                  }`}
                >
                  Nhân viên cứng
                </button>
                <button
                  type="button"
                  onClick={() => setStaffType('part-time')}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    staffType === 'part-time'
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] border-[var(--glass-border)] hover:border-indigo-500/30'
                  }`}
                >
                  Part-time
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full font-semibold" loading={loading}>
              {loading ? 'Đang tạo...' : 'Thêm nhân viên'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
