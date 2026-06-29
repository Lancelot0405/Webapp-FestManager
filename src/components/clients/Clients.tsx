import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useKeyboardInsets, handleFocusScroll } from '../../hooks/useKeyboardOffset';
import { Pencil, Trash2, Phone, Mail, MapPin, Building2, Calendar } from 'lucide-react';
import { AlertDialog, Button, Card, Modal, SearchField, TextField, Label, Input, TextArea, FieldError } from '@heroui/react';
import { animations } from '../../lib/animations';
import EmptyState from '@/components/shared/EmptyState';
import { SearchX } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FranceCityAutocomplete from '@/components/shared/FranceCityAutocomplete';

import { useClientsQuery } from '../../hooks/queries/useClientsQuery';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import { useAddClient } from '../../hooks/queries/mutations/useAddClient';
import { useUpdateClient } from '../../hooks/queries/mutations/useUpdateClient';
import { useDeleteClient } from '../../hooks/queries/mutations/useDeleteClient';
import { useToast } from '../../context/ToastContext';
import { useFABRegister } from '../../hooks/useFABRegister';
import { clientSchema } from '../../lib/validations';
import type { Client } from '../../types';

type FormValues = z.infer<typeof clientSchema>;

export default function Clients() {
  const showToast = useToast();
  const { data: clients = [] } = useClientsQuery();
  const { data: events = [] }  = useEventsQuery();
  const addClientMutation    = useAddClient();
  const updateClientMutation = useUpdateClient();
  const deleteClientMutation = useDeleteClient();

  const [search, setSearch]           = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const { bottom: keyboardOffset, viewportHeight } = useKeyboardInsets(showForm);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: '', contactName: '', phone: '', email: '', city: '', notes: '' },
  });

  const openAdd = useCallback(() => {
    reset({ name: '', contactName: '', phone: '', email: '', city: '', notes: '' });
    setEditingId(null);
    setShowForm(true);
  }, [reset]);
  useFABRegister(openAdd, 'Thêm khách hàng');

  const openEdit = (client: Client) => {
    reset({
      name: client.name,
      contactName: client.contactName,
      phone: client.phone,
      email: client.email,
      city: client.city,
      notes: client.notes,
    });
    setEditingId(client.id);
    setShowForm(true);
  };

  const onSubmit = (data: FormValues) => {
    if (editingId !== null) {
      const existing = clients.find(c => c.id === editingId)!;
      updateClientMutation.mutate(
        {
          ...existing,
          name: data.name.trim(),
          contactName: data.contactName?.trim() ?? '',
          phone: data.phone?.trim() ?? '',
          email: data.email?.trim() ?? '',
          city: data.city?.trim() ?? '',
          notes: data.notes?.trim() ?? '',
        },
        { onSuccess: () => { showToast('Đã cập nhật khách hàng', 'success'); setShowForm(false); } }
      );
    } else {
      addClientMutation.mutate(
        {
          id: Date.now(),
          name: data.name.trim(),
          contactName: data.contactName?.trim() ?? '',
          phone: data.phone?.trim() ?? '',
          email: data.email?.trim() ?? '',
          city: data.city?.trim() ?? '',
          notes: data.notes?.trim() ?? '',
          eventIds: [],
        },
        { onSuccess: () => { showToast('Đã thêm khách hàng', 'success'); setShowForm(false); } }
      );
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteClientMutation.mutate(deleteTarget.id, {
      onSuccess: () => { showToast('Đã xóa', 'info'); setDeleteTarget(null); },
    });
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase()) ||
    c.contactName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <SearchField value={search} onChange={setSearch} className="w-full" aria-label="Tìm kiếm khách hàng">
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Tìm kiếm khách hàng..." />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>

      {/* Add / Edit Modal */}
      <Modal isOpen={showForm} onOpenChange={(open) => { if (!open) setShowForm(false); }}>
        <Modal.Backdrop isDismissable>
          <Modal.Container placement="bottom" size="md" className="sm:items-center">
            <Modal.Dialog
              aria-label={editingId ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
              style={{ marginBottom: keyboardOffset, maxHeight: viewportHeight ?? undefined }}
              className="max-h-[85dvh] flex flex-col rounded-t-2xl sm:rounded-2xl"
            >
              <Modal.Header className="px-5 pt-5 pb-0 shrink-0">
                <Modal.Heading className="text-base font-bold text-foreground">
                  {editingId ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="px-5 py-4 overflow-y-auto" onFocus={handleFocusScroll}>
                <form id="client-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                  <Controller name="name" control={control} render={({ field }) => (
                    <TextField value={field.value} onChange={field.onChange} isInvalid={!!errors.name} className="w-full flex flex-col gap-1">
                      <Label className="text-xs font-medium text-foreground/80">Tên tổ chức *</Label>
                      <Input placeholder="Tên ban tổ chức / công ty" />
                      {errors.name && <FieldError className="text-xs text-danger">{errors.name.message}</FieldError>}
                    </TextField>
                  )} />
                  <Controller name="contactName" control={control} render={({ field }) => (
                    <TextField value={field.value ?? ''} onChange={field.onChange} className="w-full flex flex-col gap-1">
                      <Label className="text-xs font-medium text-foreground/80">Người liên hệ</Label>
                      <Input placeholder="Họ tên người phụ trách" />
                    </TextField>
                  )} />
                  <div className="grid grid-cols-2 gap-2">
                    <Controller name="phone" control={control} render={({ field }) => (
                      <TextField value={field.value ?? ''} onChange={field.onChange} className="w-full flex flex-col gap-1">
                        <Label className="text-xs font-medium text-foreground/80">Điện thoại</Label>
                        <Input type="tel" placeholder="+33..." />
                      </TextField>
                    )} />
                    <Controller name="email" control={control} render={({ field }) => (
                      <TextField value={field.value ?? ''} onChange={field.onChange} isInvalid={!!errors.email} className="w-full flex flex-col gap-1">
                        <Label className="text-xs font-medium text-foreground/80">Email</Label>
                        <Input type="email" placeholder="email@..." />
                        {errors.email && <FieldError className="text-xs text-danger">{errors.email.message}</FieldError>}
                      </TextField>
                    )} />
                  </div>
                  <Controller name="city" control={control} render={({ field }) => (
                    <FranceCityAutocomplete label="Thành phố" value={field.value ?? ''} onChange={field.onChange} />
                  )} />
                  <Controller name="notes" control={control} render={({ field }) => (
                    <TextField value={field.value ?? ''} onChange={field.onChange} className="w-full flex flex-col gap-1">
                      <Label className="text-xs font-medium text-foreground/80">Ghi chú</Label>
                      <TextArea placeholder="Thông tin thêm..." rows={2} style={{ maxHeight: `${4 * 1.5}rem` }} />
                    </TextField>
                  )} />
                </form>
              </Modal.Body>
              <Modal.Footer className="px-5 pb-5 flex gap-2 justify-end shrink-0">
                <Button variant="ghost" onPress={() => setShowForm(false)} className="rounded-xl">Hủy</Button>
                <Button type="submit" form="client-form" variant="primary" className="rounded-xl">
                  {editingId ? 'Lưu thay đổi' : 'Thêm khách hàng'}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Delete confirmation */}
      <AlertDialog isOpen={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog aria-label="Xác nhận xóa">
              <AlertDialog.Header>
                <AlertDialog.Icon />
                <AlertDialog.Heading>Xóa khách hàng?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm text-muted">
                  Xóa <span className="font-semibold text-foreground">{deleteTarget?.name}</span>? Thao tác này không thể hoàn tác.
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer className="flex gap-2 justify-end">
                <Button variant="ghost" onPress={() => setDeleteTarget(null)} className="rounded-xl">Hủy</Button>
                <Button
                  variant="primary"
                  onPress={confirmDelete}
                  isDisabled={deleteClientMutation.isPending}
                  className="rounded-xl"
                >
                  {deleteClientMutation.isPending ? 'Đang xóa...' : 'Xóa'}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>

      {/* Client list */}
      {filtered.length === 0 ? (
        search ? (
          <EmptyState icon={<SearchX size={26} />} title="Không tìm thấy kết quả" />
        ) : (
          <EmptyState icon={<Building2 size={26} />} title="Chưa có khách hàng nào" description="Thêm khách hàng/đối tác để liên kết với sự kiện." />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filtered.map((client, i) => {
            const clientEvents = events.filter(e => client.eventIds.includes(e.id));
            const initials = client.name.trim().split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
            return (
              <motion.div key={client.id} {...animations.listItem(i)} {...animations.press}>
                <Card className="p-0 overflow-hidden hover:shadow-md transition-shadow duration-200">
                  {/* Header */}
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                    <div className="w-10 h-10 rounded-full accent-gradient flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate leading-tight">{client.name}</p>
                      {client.contactName && (
                        <p className="text-xs text-muted truncate mt-0.5">{client.contactName}</p>
                      )}
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <Button onPress={() => openEdit(client)} variant="ghost" isIconOnly size="sm" className="rounded-lg text-muted hover:text-foreground w-7 h-7 min-w-0"><Pencil size={13} /></Button>
                      <Button onPress={() => setDeleteTarget(client)} variant="ghost" isIconOnly size="sm" className="rounded-lg text-muted hover:text-danger w-7 h-7 min-w-0"><Trash2 size={13} /></Button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-separator mx-4" />

                  {/* Info */}
                  <div className="px-4 py-3 space-y-1.5">
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="text-muted shrink-0" />
                        <span className="text-xs text-foreground/80 truncate">{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="text-muted shrink-0" />
                        <span className="text-xs text-foreground/80 truncate">{client.email}</span>
                      </div>
                    )}
                    {client.city && (
                      <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-muted shrink-0" />
                        <span className="text-xs text-foreground/80 truncate">{client.city}</span>
                      </div>
                    )}
                    {client.notes && (
                      <p className="text-xs text-muted italic truncate">{client.notes}</p>
                    )}
                  </div>

                  {/* Footer badge */}
                  {clientEvents.length > 0 && (
                    <div className="px-4 pb-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent bg-accent/10 rounded-full px-2.5 py-0.5">
                        <Calendar size={10} />
                        {clientEvents.length} sự kiện
                      </span>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
