import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, ShieldCheck, Building2 } from 'lucide-react';
import { Button } from '@heroui/react';
import { useCreateStaffMutation } from '../../hooks/queries/useMutations';
import { useApp } from '../../context/AppContext';
import { adminApi } from '../../lib/adminApi';
import { useToast } from '../../context/ToastContext';
import { Input } from '@/components/ui/input';
import { staffFormSchema } from '../../lib/validations';
import type { StaffMember, StaffType, UserRole, UserDepartment } from '../../types';
import { z } from 'zod';

type StaffFormInputs = z.infer<typeof staffFormSchema>;

const DOMAIN = '@fm.com';

interface Props {
  onClose: () => void;
}

export default function AddStaffForm({ onClose }: Props) {
  const { state: { currentUser } } = useApp();
  const createStaffMutation = useCreateStaffMutation();
  const showToast = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StaffFormInputs>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: '',
      username: '',
      dob: '',
      city: '',
      role: 'staff',
      department: 'restaurant',
      staffType: 'permanent',
    },
  });

  const role = watch('role');
  const department = watch('department');
  const staffType = watch('staffType');

  const isAdmin   = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';

  const onSubmit = async (data: StaffFormInputs) => {
    setLoading(true);

    const dobFormatted = data.dob
      ? (() => { const [yyyy, mm, dd] = data.dob.split('-'); return `${dd}-${mm}-${yyyy}`; })()
      : '';

    let userId: string | undefined;

    if (data.username && data.username.trim()) {
      const email = data.username.trim().toLowerCase() + DOMAIN;
      const { data: resData, error } = await adminApi.createStaff({
        email,
        password: 'fest1234',
        name: data.name.trim(),
        role: isAdmin ? data.role : 'staff',
        department: data.department,
      });
      if (error) {
        showToast(`Lỗi tạo tài khoản: ${error}`, 'error');
        setLoading(false);
        return;
      }
      userId = resData?.userId;
    }

    const newStaff: StaffMember = {
      id: Date.now(),
      userId,
      name: data.name.trim(),
      dob: dobFormatted,
      city: data.city.trim(),
      staffType: data.staffType,
      contracts: [],
    };
    createStaffMutation.mutate({ staff: newStaff, userId });
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Tên *"
            error={errors.name?.message}
            {...register('name')}
            onChange={(v) => setValue('name', v, { shouldValidate: true })}
            placeholder="Nguyễn Văn A"
          />

          <div>
            <Input
              label="Tên đăng nhập (để tạo tài khoản)"
              placeholder="nguyenvana"
              error={errors.username?.message}
              {...register('username')}
              onChange={(v) => setValue('username', v.replace(/\s/g, '').toLowerCase(), { shouldValidate: true })}
              autoComplete="off"
              endContent={<span className="font-mono text-xs">@fm.com</span>}
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Mật khẩu mặc định: <span className="font-semibold text-[var(--text-primary)]">fest1234</span>
            </p>
          </div>

          <Input
            type="date"
            label="Ngày sinh"
            error={errors.dob?.message}
            {...register('dob')}
            onChange={(v) => setValue('dob', v, { shouldValidate: true })}
          />

          <Input
            label="Thành phố *"
            error={errors.city?.message}
            {...register('city')}
            onChange={(v) => setValue('city', v, { shouldValidate: true })}
            placeholder="Paris"
          />
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
                    <Button
                      key={r}
                      variant="ghost"
                      onPress={() => setValue('role', r)}
                      className={`w-full h-auto min-w-0 py-2 rounded-xl text-xs font-semibold border transition-colors ${
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
                    </Button>
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
                    <Button
                      key={id}
                      variant="ghost"
                      onPress={() => setValue('department', id)}
                      className={`w-full h-auto min-w-0 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                        department === id
                          ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30'
                          : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] border-[var(--glass-border)] hover:border-[var(--success)]/30'
                      }`}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Loại nhân viên</label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: 'permanent' as StaffType, label: 'Nhân viên cứng' },
              { id: 'part-time' as StaffType, label: 'Part-time'       },
            ]).map(({ id, label }) => (
              <Button
                key={id}
                variant="ghost"
                onPress={() => setValue('staffType', id)}
                className={`w-full h-auto min-w-0 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                  staffType === id
                    ? id === 'part-time'
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30'
                    : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] border-[var(--glass-border)] hover:border-[var(--primary)]/30'
                }`}
              >
                {label}
              </Button>
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
