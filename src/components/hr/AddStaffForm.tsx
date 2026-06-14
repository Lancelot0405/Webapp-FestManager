import { useState } from 'react';
import { ShieldCheck, Building2 } from 'lucide-react';
import { Button, Modal, ToggleButtonGroup, ToggleButton } from '@heroui/react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApp } from '../../context/AppContext';
import { adminApi } from '../../lib/adminApi';
import { useToast } from '../../context/ToastContext';
import { useCreateStaff } from '../../hooks/queries/mutations/useCreateStaff';
import { Input } from '@/components/shared/GlassInput';
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
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop isDismissable>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog aria-label="Thêm nhân viên mới">
            <Modal.Header className="px-5 pt-5 pb-0">
              <Modal.Heading className="text-base font-bold text-foreground">Thêm nhân viên mới</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="px-5 py-4 overflow-y-auto max-h-[70vh]">
              <form id="add-staff-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input label="Tên *" placeholder="Nguyễn Văn A" value={field.value} onChange={field.onChange} error={errors.name?.message} />
                  )}
                />

                <div>
                  <Controller
                    name="username"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Tên đăng nhập (để tạo tài khoản)"
                        placeholder="nguyenvana"
                        value={field.value ?? ''}
                        onChange={(v) => field.onChange(v.replace(/\s/g, '').toLowerCase())}
                        autoComplete="off"
                        endContent={<span className="font-mono text-xs">@fm.com</span>}
                      />
                    )}
                  />
                  <p className="text-xs text-muted mt-1">
                    Mật khẩu mặc định: <span className="font-semibold text-foreground">fest1234</span>
                  </p>
                </div>

                {(isAdmin || isManager) && (
                  <div className="bg-default/50 border border-separator rounded-xl p-3 space-y-3">
                    {isAdmin && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck size={13} className="text-muted" />
                          <span className="text-xs font-semibold text-foreground/80">Quyền tài khoản</span>
                        </div>
                        <ToggleButtonGroup
                          selectionMode="single"
                          disallowEmptySelection
                          selectedKeys={new Set([role])}
                          onSelectionChange={(keys) => { const k = [...keys][0]; if (k) setRole(k as UserRole); }}
                          className="w-full"
                        >
                          {(['staff', 'manager', 'admin'] as UserRole[]).map(r => (
                            <ToggleButton key={r} id={r} className="flex-1 rounded-xl text-xs py-2">
                              {r === 'staff' ? 'Nhân viên' : r === 'manager' ? 'Quản lý' : 'Admin'}
                            </ToggleButton>
                          ))}
                        </ToggleButtonGroup>
                      </div>
                    )}

                    {(!isAdmin || role !== 'admin') && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={13} className="text-muted" />
                          <span className="text-xs font-semibold text-foreground/80">Bộ phận kho hàng</span>
                        </div>
                        <ToggleButtonGroup
                          selectionMode="single"
                          disallowEmptySelection
                          selectedKeys={new Set([department])}
                          onSelectionChange={(keys) => { const k = [...keys][0]; if (k) setDepartment(k as UserDepartment); }}
                          className="w-full"
                        >
                          {([
                            { id: 'restaurant' as UserDepartment, label: 'Nhà hàng' },
                            { id: 'festival'   as UserDepartment, label: 'Festival' },
                            { id: 'both'       as UserDepartment, label: 'Cả hai'   },
                          ]).map(({ id, label }) => (
                            <ToggleButton key={id} id={id} className="flex-1 rounded-xl text-xs py-2">
                              {label}
                            </ToggleButton>
                          ))}
                        </ToggleButtonGroup>
                      </div>
                    )}
                  </div>
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
                  <ToggleButtonGroup
                    selectionMode="single"
                    disallowEmptySelection
                    selectedKeys={new Set([staffType])}
                    onSelectionChange={(keys) => { const k = [...keys][0]; if (k) setStaffType(k as StaffType); }}
                    className="w-full"
                  >
                    <ToggleButton id="permanent" className="flex-1 rounded-xl text-xs py-2">Nhân viên cứng</ToggleButton>
                    <ToggleButton id="part-time" className="flex-1 rounded-xl text-xs py-2">Part-time</ToggleButton>
                  </ToggleButtonGroup>
                </div>
              </form>
            </Modal.Body>
            <Modal.Footer className="px-5 pb-5 flex gap-2 justify-end">
              <Button variant="ghost" onPress={onClose} className="rounded-xl">Hủy</Button>
              <Button
                type="submit"
                form="add-staff-form"
                variant="primary"
                className="rounded-xl"
                isDisabled={loading}
              >
                {loading ? 'Đang tạo...' : 'Thêm nhân viên'}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
