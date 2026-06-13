import { useState } from 'react';
import { Plus, X, Pencil, Trash2, Phone, Mail, MapPin, Building2, Check, Search } from 'lucide-react';
import { Button } from '@heroui/react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/shared/GlassInput';
import { Textarea } from '@/components/shared/GlassTextarea';

import { useClientsQuery } from '../../hooks/queries/useClientsQuery';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import { useAddClient } from '../../hooks/queries/mutations/useAddClient';
import { useUpdateClient } from '../../hooks/queries/mutations/useUpdateClient';
import { useDeleteClient } from '../../hooks/queries/mutations/useDeleteClient';
import { useToast } from '../../context/ToastContext';
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

  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: '', contactName: '', phone: '', email: '', city: '', notes: '' },
  });

  const openAdd = () => {
    reset({ name: '', contactName: '', phone: '', email: '', city: '', notes: '' });
    setEditingId(null);
    setShowForm(true);
  };

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

  const handleDelete = (id: number) => {
    if (!confirm('Xóa khách hàng này?')) return;
    deleteClientMutation.mutate(id, { onSuccess: () => showToast('Đã xóa', 'info') });
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase()) ||
    c.contactName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="hidden md:flex items-center justify-end">
        <Button onPress={openAdd} variant="primary" size="sm" className="flex items-center gap-1.5 rounded-xl">
          <Plus size={15} /> Thêm
        </Button>
      </div>
      <Button onPress={openAdd} isIconOnly aria-label="Thêm khách hàng" className="md:hidden fixed bottom-24 right-4 z-30 h-14 w-14 rounded-full bg-accent text-white dark:text-foreground shadow-xl active:scale-95 transition-transform">
          <Plus size={24} />
        </Button>

      <Input value={search} onChange={setSearch} placeholder="Tìm kiếm khách hàng..." startContent={<Search size={15} />} />

      {showForm && (
        <div className="bg-surface border border-separator rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="font-semibold text-sm text-foreground">{editingId ? 'Chỉnh sửa' : 'Thêm khách hàng mới'}</p>
            <Button onPress={() => setShowForm(false)} variant="ghost" isIconOnly size="sm" className="rounded-full"><X size={16} /></Button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  label="Tên tổ chức *"
                  placeholder="Tên ban tổ chức / công ty"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.name?.message}
                />
              )}
            />
            <Controller
              name="contactName"
              control={control}
              render={({ field }) => (
                <Input
                  label="Người liên hệ"
                  placeholder="Họ tên người phụ trách"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              )}
            />
            <div className="grid grid-cols-2 gap-2">
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Điện thoại"
                    type="tel"
                    placeholder="+33..."
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                )}
              />
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Email"
                    type="email"
                    placeholder="email@..."
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={errors.email?.message}
                  />
                )}
              />
            </div>
            <Controller
              name="city"
              control={control}
              render={({ field }) => (
                <Input
                  label="Thành phố"
                  placeholder="Paris"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <Textarea
                  label="Ghi chú"
                  placeholder="Thông tin thêm..."
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  minRows={2}
                  maxRows={4}
                />
              )}
            />
            <Button type="submit" variant="primary" fullWidth className="rounded-lg">
              {editingId ? 'Lưu thay đổi' : 'Thêm khách hàng'}
            </Button>
          </form>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <Building2 size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">{search ? 'Không tìm thấy kết quả' : 'Chưa có khách hàng nào'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filtered.map(client => {
            const clientEvents = events.filter(e => client.eventIds.includes(e.id));
            return (
              <div key={client.id} className="bg-surface border border-separator rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{client.name}</p>
                    {client.contactName && (
                      <p className="text-xs text-foreground/80 mt-0.5 flex items-center gap-1">
                        <Check size={11} /> {client.contactName}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button onPress={() => openEdit(client)} variant="ghost" isIconOnly size="sm" className="rounded-lg text-muted hover:text-foreground"><Pencil size={14} /></Button>
                    <Button onPress={() => handleDelete(client.id)} variant="ghost" isIconOnly size="sm" className="rounded-lg text-muted hover:text-danger"><Trash2 size={14} /></Button>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {client.phone && <p className="text-xs text-muted flex items-center gap-1.5"><Phone size={11} /> {client.phone}</p>}
                  {client.email && <p className="text-xs text-muted flex items-center gap-1.5"><Mail size={11} /> {client.email}</p>}
                  {client.city  && <p className="text-xs text-muted flex items-center gap-1.5"><MapPin size={11} /> {client.city}</p>}
                </div>
                {clientEvents.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-separator">
                    <p className="text-xs text-muted">{clientEvents.length} sự kiện liên quan</p>
                  </div>
                )}
                {client.notes && <p className="text-xs text-muted mt-1.5 italic">{client.notes}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
