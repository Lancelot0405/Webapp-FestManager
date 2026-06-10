import { useState } from 'react';
import { X, ShieldCheck, Building2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { adminApi } from '../../lib/adminApi';
import { useToast } from '../../context/ToastContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
      // Tạo qua Edge Function "admin" (createUser + ghi users row ở server).
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
      <DialogContent position="bottom" hideClose className="w-full max-w-md bg-white dark:bg-[var(--card-bg)] overflow-hidden">
      <div className="px-5 pt-5 pb-[calc(env(safe-area-inset-bottom,0px)+80px)] max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <div className="flex justify-between items-center mb-5">
          <p className="text-base font-bold text-[var(--text-primary)]">Thêm nhân viên mới</p>
          <button onClick={onClose} aria-label="Đóng" className="w-8 h-8 flex items-center justify-center rounded-full bg-brand-50 dark:bg-[var(--card-bg)] text-[var(--text-muted)] dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-[var(--accent)] transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--text-primary)] dark:text-brand-300 mb-1 block">Tên *</label>
            <input
              required
              className="w-full px-3 py-2.5 border border-brand-200 dark:border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] bg-white dark:bg-[var(--card-bg)] focus:outline-none focus:border-brand-400 dark:focus:border-brand-400 placeholder:text-[var(--text-muted)] transition-all"
              placeholder="Nguyễn Văn A"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-primary)] dark:text-brand-300 mb-1 block">
              Tên đăng nhập <span className="font-normal text-[var(--text-muted)] dark:text-brand-400">(để tạo tài khoản)</span>
            </label>
            <div className="flex items-stretch border border-brand-200 dark:border-[var(--border-color)] rounded-xl overflow-hidden focus-within:border-brand-400 transition-all">
              <input
                className="flex-1 px-3 py-2.5 text-sm bg-white dark:bg-[var(--card-bg)] dark:text-[var(--text-primary)] dark:placeholder:text-[var(--text-muted)] focus:outline-none"
                placeholder="nguyenvana"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={username}
                onChange={e => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
              />
              <span className="px-2.5 text-xs text-[var(--text-muted)] dark:text-brand-400 bg-brand-50 dark:bg-[var(--card-bg)] border-l border-brand-200 dark:border-[var(--border-color)] flex items-center shrink-0 font-mono">
                @fm.com
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] dark:text-brand-400 mt-1">
              Mật khẩu mặc định: <span className="font-semibold text-[var(--text-primary)] dark:text-brand-300">fest1234</span>
            </p>
          </div>

          {(isAdmin || isManager) && (
            <div className="bg-saffron-50 dark:bg-saffron-900/20 border border-saffron-200 dark:border-saffron-700 rounded-xl p-3 space-y-3">
              {/* Role — admin only */}
              {isAdmin && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-saffron-600 dark:text-saffron-400" />
                    <span className="text-xs font-semibold text-saffron-700 dark:text-saffron-400">Quyền tài khoản</span>
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
                              ? 'bg-red-600 text-white border-red-600'
                              : r === 'manager'
                                ? 'bg-saffron-500 text-white border-saffron-500'
                                : 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white dark:bg-[var(--card-bg)] text-[var(--text-primary)] dark:text-brand-300 border-brand-200 dark:border-[var(--border-color)]'
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
                    <Building2 size={13} className="text-saffron-600 dark:text-saffron-400" />
                    <span className="text-xs font-semibold text-saffron-700 dark:text-saffron-400">Bộ phận kho hàng</span>
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
                            ? 'bg-herb-600 text-white border-herb-600'
                            : 'bg-white dark:bg-[var(--card-bg)] text-[var(--text-primary)] dark:text-brand-300 border-brand-200 dark:border-[var(--border-color)]'
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
            <label className="text-xs font-semibold text-[var(--text-primary)] dark:text-brand-300 mb-1 block">Ngày sinh</label>
            <div className="overflow-hidden rounded-xl">
              <input
                type="date"
                className="border border-brand-200 dark:border-[var(--border-color)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 transition-all"
                value={dob}
                onChange={e => setDob(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-primary)] dark:text-brand-300 mb-1 block">Thành phố *</label>
            <input
              required
              className="w-full px-3 py-2.5 border border-brand-200 dark:border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] bg-white dark:bg-[var(--card-bg)] focus:outline-none focus:border-brand-400 dark:focus:border-brand-400 placeholder:text-[var(--text-muted)] transition-all"
              placeholder="Paris"
              value={city}
              onChange={e => setCity(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-primary)] dark:text-brand-300 mb-1 block">Loại nhân viên</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setStaffType('permanent')}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  staffType === 'permanent'
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white dark:bg-[var(--card-bg)] text-[var(--text-primary)] dark:text-brand-300 border-brand-200 dark:border-[var(--border-color)] hover:border-brand-300'
                }`}
              >
                Nhân viên cứng
              </button>
              <button
                type="button"
                onClick={() => setStaffType('part-time')}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  staffType === 'part-time'
                    ? 'bg-saffron-600 text-white border-saffron-600'
                    : 'bg-white dark:bg-[var(--card-bg)] text-[var(--text-primary)] dark:text-brand-300 border-brand-200 dark:border-[var(--border-color)] hover:border-saffron-300'
                }`}
              >
                Part-time
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full font-semibold shadow-warm" loading={loading}>
            {loading ? 'Đang tạo...' : 'Thêm nhân viên'}
          </Button>
        </form>
      </div>
      </DialogContent>
    </Dialog>
  );
}
