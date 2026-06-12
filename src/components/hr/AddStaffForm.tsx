import { useState } from 'react';
import { X, ShieldCheck, Building2 } from 'lucide-react';
import { Button } from '@heroui/react';
import { useApp } from '../../context/AppContext';
import { adminApi } from '../../lib/adminApi';
import { useToast } from '../../context/ToastContext';
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
      const { data, error } = await adminApi.createStaff({
        email,
        password: 'fest1234',
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
    <div className="glass-card rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <p className="font-semibold text-sm text-[var(--text-primary)]">Thêm nhân viên mới</p>
        <Button
          onPress={onClose}
          variant="ghost"
          isIconOnly
          size="sm"
          className="rounded-full"
          aria-label="Đóng"
        >
          <X size={16} />
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <Input
          label="Tên *"
          isRequired
          value={name}
          onChange={setName}
          placeholder="Nguyễn Văn A"
        />

        <div>
          <Input
            label="Tên đăng nhập (để tạo tài khoản)"
            placeholder="nguyenvana"
            value={username}
            onChange={(v) => setUsername(v.replace(/\s/g, '').toLowerCase())}
            autoComplete="off"
            endContent={<span className="font-mono text-xs">@fm.com</span>}
          />
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Mật khẩu mặc định: <span className="font-semibold text-[var(--text-primary)]">fest1234</span>
          </p>
        </div>

        {(isAdmin || isManager) && (
          <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-3 space-y-3 backdrop-blur-[var(--glass-blur)]">
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
                    { id: 'both'       as UserDepartment, label: 'Cả hai'   },
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

        <Input
          type="date"
          label="Ngày sinh"
          value={dob}
          onChange={setDob}
        />

        <Input
          label="Thành phố *"
          isRequired
          value={city}
          onChange={setCity}
          placeholder="Paris"
        />

        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Loại nhân viên</label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: 'permanent' as StaffType, label: 'Nhân viên cứng' },
              { id: 'part-time' as StaffType, label: 'Part-time'       },
            ]).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setStaffType(id)}
                className={`py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                  staffType === id
                    ? id === 'part-time'
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30'
                    : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] border-[var(--glass-border)] hover:border-[var(--primary)]/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" variant="primary" fullWidth className="rounded-lg" isDisabled={loading}>
          {loading ? 'Đang tạo...' : 'Thêm nhân viên'}
        </Button>
      </form>
    </div>
  );
}
