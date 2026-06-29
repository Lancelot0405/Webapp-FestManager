import { useState } from 'react';
import { useKeyboardInsets, handleFocusScroll } from '../../hooks/useKeyboardOffset';
import { ShieldCheck, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApp } from '../../context/AppContext';
import { adminApi } from '../../lib/adminApi';
import { useToast } from '../../context/ToastContext';
import { useCreateStaff } from '../../hooks/queries/mutations/useCreateStaff';
import AppDatePicker from '@/components/shared/AppDatePicker';
import FranceCityAutocomplete from '@/components/shared/FranceCityAutocomplete';
import { staffSchema } from '../../lib/validations';
import type { StaffMember, StaffType, UserRole, UserDepartment } from '../../types';

const DOMAIN = '@fm.com';

interface Props {
  onClose: () => void;
}

type FormValues = z.infer<typeof staffSchema>;

export default function AddStaffForm({ onClose }: Props) {
  const { bottom: keyboardOffset, viewportHeight } = useKeyboardInsets(true);
  const { currentUser } = useApp();
  const showToast = useToast();
  const createStaffMutation = useCreateStaff();

  const [staffType,  setStaffType]  = useState<StaffType>('permanent');
  const [role,       setRole]       = useState<UserRole>('staff');
  const [department, setDepartment] = useState<UserDepartment>('restaurant');
  const [loading,    setLoading]    = useState(false);

  const isAdmin   = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: { name: '', city: '', dob: '', username: '' },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);

    const dobFormatted = data.dob
      ? (() => { const [yyyy, mm, dd] = data.dob!.split('-'); return `${dd}-${mm}-${yyyy}`; })()
      : '';

    let userId: string | undefined;

    if (data.username?.trim()) {
      const email = data.username.trim().toLowerCase() + DOMAIN;
      const { data: apiData, error } = await adminApi.createStaff({
        email,
        password: 'fest1234',
        name: data.name.trim(),
        role: isAdmin ? role : 'staff',
        department,
      });
      if (error) {
        showToast(`Lỗi tạo tài khoản: ${error}`, 'error');
        setLoading(false);
        return;
      }
      userId = apiData?.userId;
    }

    const newStaff: StaffMember = {
      id: Date.now(),
      userId,
      name: data.name.trim(),
      dob: dobFormatted,
      city: data.city.trim(),
      staffType,
      contracts: [],
    };
    createStaffMutation.mutate(
      { staff: newStaff, userId },
      {
        onSuccess: () => {
          showToast('Đã thêm nhân viên', 'success');
          setLoading(false);
          onClose();
        },
        onError: () => {
          setLoading(false);
        },
      }
    );
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="max-h-[85dvh] flex flex-col rounded-t-2xl sm:rounded-2xl p-0 outline-none overflow-hidden"
        style={{ marginBottom: keyboardOffset, maxHeight: viewportHeight ?? undefined }}
      >
        <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
          <DialogTitle className="text-base font-bold text-foreground">Thêm nhân viên mới</DialogTitle>
        </DialogHeader>
        <div className="px-5 py-4 overflow-y-auto" onFocus={handleFocusScroll}>
          <form id="add-staff-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <div className="w-full flex flex-col gap-1">
                  <Label htmlFor="name" className="text-xs font-medium text-foreground/80">Tên *</Label>
                  <Input id="name" placeholder="Nguyễn Văn A" {...field} />
                  {errors.name && <p className="text-xs text-destructive mt-0.5">{errors.name.message}</p>}
                </div>
              )}
            />

            <div>
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <div className="w-full flex flex-col gap-1">
                    <Label htmlFor="username" className="text-xs font-medium text-foreground/80">Tên đăng nhập (để tạo tài khoản)</Label>
                    <div className="relative flex items-center">
                      <Input
                        id="username"
                        placeholder="nguyenvana"
                        autoComplete="off"
                        className="pr-16"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value.replace(/\s/g, '').toLowerCase())}
                      />
                      <span className="absolute right-3 z-10 font-mono text-xs text-muted">@fm.com</span>
                    </div>
                  </div>
                )}
              />
              <p className="text-xs text-muted mt-1">
                Mật khẩu mặc định: <span className="font-semibold text-foreground">fest1234</span>
              </p>
            </div>

            {(isAdmin || isManager) && (
              <Card className="p-3 space-y-3 border">
                {isAdmin && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-muted" />
                      <span className="text-xs font-semibold text-foreground/80">Quyền tài khoản</span>
                    </div>
                    <ToggleGroup
                      type="single"
                      value={role}
                      onValueChange={(val) => { if (val) setRole(val as UserRole); }}
                      className="w-full bg-muted/40 p-1 rounded-xl border flex"
                    >
                      {(['staff', 'manager', 'admin'] as UserRole[]).map(r => (
                        <ToggleGroupItem key={r} value={r} className="flex-1 rounded-lg text-xs py-2 h-9 font-semibold">
                          {r === 'staff' ? 'Nhân viên' : r === 'manager' ? 'Quản lý' : 'Admin'}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                )}

                {(!isAdmin || role !== 'admin') && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={13} className="text-muted" />
                      <span className="text-xs font-semibold text-foreground/80">Bộ phận kho hàng</span>
                    </div>
                    <ToggleGroup
                      type="single"
                      value={department}
                      onValueChange={(val) => { if (val) setDepartment(val as UserDepartment); }}
                      className="w-full bg-muted/40 p-1 rounded-xl border flex"
                    >
                      {([
                        { id: 'restaurant' as UserDepartment, label: 'Nhà hàng' },
                        { id: 'festival'   as UserDepartment, label: 'Festival' },
                        { id: 'both'       as UserDepartment, label: 'Cả hai'   },
                      ]).map(({ id, label }) => (
                        <ToggleGroupItem key={id} value={id} className="flex-1 rounded-lg text-xs py-2 h-9 font-semibold">
                          {label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                )}
              </Card>
            )}

            <Controller
              name="dob"
              control={control}
              render={({ field }) => (
                <AppDatePicker label="Ngày sinh" value={field.value ?? ''} onChange={field.onChange} />
              )}
            />

            <Controller
              name="city"
              control={control}
              render={({ field }) => (
                <FranceCityAutocomplete label="Thành phố *" value={field.value} onChange={field.onChange} error={errors.city?.message} />
              )}
            />

            <div>
              <label className="text-xs font-medium text-foreground/80 mb-1.5 block">Loại nhân viên</label>
              <ToggleGroup
                type="single"
                value={staffType}
                onValueChange={(val) => { if (val) setStaffType(val as StaffType); }}
                className="w-full bg-muted/40 p-1 rounded-xl border flex"
              >
                <ToggleGroupItem value="permanent" className="flex-1 rounded-lg text-xs py-2 h-9 font-semibold">Nhân viên cứng</ToggleGroupItem>
                <ToggleGroupItem value="part-time" className="flex-1 rounded-lg text-xs py-2 h-9 font-semibold">Part-time</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </form>
        </div>
        <DialogFooter className="px-5 pb-5 flex gap-2 justify-end shrink-0">
          <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">Hủy</Button>
          <Button
            type="submit"
            form="add-staff-form"
            className="rounded-xl"
            disabled={loading}
          >
            {loading ? 'Đang tạo...' : 'Thêm nhân viên'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
