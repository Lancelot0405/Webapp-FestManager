import { useState, useCallback } from 'react';
import { Pencil, Trash2, Phone, Mail, MapPin, Building2 } from 'lucide-react';
import { AlertDialog, Button, Card, EmptyState, Modal, SearchField } from '@heroui/react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/shared/GlassInput';
import { Textarea } from '@/components/shared/GlassTextarea';
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
              className="max-h-[85dvh] flex flex-col rounded-t-2xl sm:rounded-2xl"
            >
              <Modal.Header className="px-5 pt-5 pb-0 shrink-0">
                <Modal.Heading className="text-base font-bold text-foreground">
                  {editingId ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="px-5 py-4 overflow-y-auto">
                <form id="client-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                  <Controller name="name" control={control} render={({ field }) => (
                    <Input label="Tên tổ chức *" placeholder="Tên ban tổ chức / công ty" value={field.value} onChange={field.onChange} error={errors.name?.message} />
                  )} />
                  <Controller name="contactName" control={control} render={({ field }) => (
                    <Input label="Người liên hệ" placeholder="Họ tên người phụ trách" value={field.value ?? ''} onChange={field.onChange} />
                  )} />
                  <div className="grid grid-cols-2 gap-2">
                    <Controller name="phone" control={control} render={({ field }) => (
                      <Input label="Điện thoại" type="tel" placeholder="+33..." value={field.value ?? ''} onChange={field.onChange} />
                    )} />
                    <Controller name="email" control={control} render={({ field }) => (
                      <Input label="Email" type="email" placeholder="email@..." value={field.value ?? ''} onChange={field.onChange} error={errors.email?.message} />
                    )} />
                  </div>
                  <Controller name="city" control={control} render={({ field }) => (
                    <FranceCityAutocomplete label="Thành phố" value={field.value ?? ''} onChange={field.onChange} />
                  )} />
                  <Controller name="notes" control={control} render={({ field }) => (
                    <Textarea label="Ghi chú" placeholder="Thông tin thêm..." value={field.value ?? ''} onChange={field.onChange} minRows={2} maxRows={4} />
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
        <EmptyState className="py-12 flex flex-col items-center gap-2">
          <Building2 size={36} className="opacity-30 text-muted" />
          <p className="text-sm text-muted">{search ? 'Không tìm thấy kết quả' : 'Chưa có khách hàng nào'}</p>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filtered.map(client => {
            const clientEvents = events.filter(e => client.eventIds.includes(e.id));
            return (
              <Card key={client.id}>
                <Card.Header className="px-4 pt-4 pb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Card.Title className="text-sm font-semibold text-foreground truncate">{client.name}</Card.Title>
                    {client.contactName && (
                      <Card.Description className="text-xs text-foreground/70 mt-0.5">{client.contactName}</Card.Description>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button onPress={() => openEdit(client)} variant="ghost" isIconOnly size="sm" className="rounded-lg text-muted hover:text-foreground"><Pencil size={14} /></Button>
                    <Button onPress={() => setDeleteTarget(client)} variant="ghost" isIconOnly size="sm" className="rounded-lg text-muted hover:text-danger"><Trash2 size={14} /></Button>
                  </div>
                </Card.Header>
                <Card.Content className="px-4 pb-4 space-y-1">
                  {client.phone && <p className="text-xs text-muted flex items-center gap-1.5"><Phone size={11} /> {client.phone}</p>}
                  {client.email && <p className="text-xs text-muted flex items-center gap-1.5"><Mail size={11} /> {client.email}</p>}
                  {client.city  && <p className="text-xs text-muted flex items-center gap-1.5"><MapPin size={11} /> {client.city}</p>}
                  {clientEvents.length > 0 && (
                    <p className="text-xs text-muted pt-1.5 mt-1.5 border-t border-separator">{clientEvents.length} sự kiện liên quan</p>
                  )}
                  {client.notes && <p className="text-xs text-muted italic">{client.notes}</p>}
                </Card.Content>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
