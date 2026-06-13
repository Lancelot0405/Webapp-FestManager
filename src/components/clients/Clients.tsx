import { useState } from 'react';
import { Plus, X, Pencil, Trash2, Phone, Mail, MapPin, Building2, Check, Search } from 'lucide-react';
import { Button } from '@heroui/react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Fab } from '@/components/ui/fab';
import { useClientsQuery } from '../../hooks/queries/useClientsQuery';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import { useAddClient } from '../../hooks/queries/mutations/useAddClient';
import { useUpdateClient } from '../../hooks/queries/mutations/useUpdateClient';
import { useDeleteClient } from '../../hooks/queries/mutations/useDeleteClient';
import { useToast } from '../../context/ToastContext';
import type { Client } from '../../types';

export default function Clients() {
  const showToast = useToast();
  const { data: clients = [] } = useClientsQuery();
  const { data: events = [] }  = useEventsQuery();
  const addClientMutation    = useAddClient();
  const updateClientMutation = useUpdateClient();
  const deleteClientMutation = useDeleteClient();

  const [search, setSearch]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [fName,        setFName]        = useState('');
  const [fContactName, setFContactName] = useState('');
  const [fPhone,       setFPhone]       = useState('');
  const [fEmail,       setFEmail]       = useState('');
  const [fCity,        setFCity]        = useState('');
  const [fNotes,       setFNotes]       = useState('');

  const resetForm = () => {
    setFName(''); setFContactName(''); setFPhone('');
    setFEmail(''); setFCity(''); setFNotes('');
    setEditingId(null);
  };

  const openAdd = () => { resetForm(); setShowForm(true); };

  const openEdit = (client: Client) => {
    setFName(client.name); setFContactName(client.contactName);
    setFPhone(client.phone); setFEmail(client.email);
    setFCity(client.city); setFNotes(client.notes);
    setEditingId(client.id); setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim()) return;
    if (editingId !== null) {
      const existing = clients.find(c => c.id === editingId)!;
      updateClientMutation.mutate(
        { ...existing, name: fName.trim(), contactName: fContactName.trim(), phone: fPhone.trim(), email: fEmail.trim(), city: fCity.trim(), notes: fNotes.trim() },
        { onSuccess: () => { showToast('Đã cập nhật khách hàng', 'success'); setShowForm(false); resetForm(); } }
      );
    } else {
      addClientMutation.mutate(
        { id: Date.now(), name: fName.trim(), contactName: fContactName.trim(), phone: fPhone.trim(), email: fEmail.trim(), city: fCity.trim(), notes: fNotes.trim(), eventIds: [] },
        { onSuccess: () => { showToast('Đã thêm khách hàng', 'success'); setShowForm(false); resetForm(); } }
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
      <Fab onPress={openAdd} label="Thêm khách hàng" icon={<Plus size={24} />} />

      <Input value={search} onChange={setSearch} placeholder="Tìm kiếm khách hàng..." startContent={<Search size={15} />} />

      {showForm && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="font-semibold text-sm text-[var(--text-primary)]">{editingId ? 'Chỉnh sửa' : 'Thêm khách hàng mới'}</p>
            <Button onPress={() => { setShowForm(false); resetForm(); }} variant="ghost" isIconOnly size="sm" className="rounded-full"><X size={16} /></Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <Input label="Tên tổ chức *" value={fName} onChange={setFName} placeholder="Tên ban tổ chức / công ty" />
            <Input label="Người liên hệ" value={fContactName} onChange={setFContactName} placeholder="Họ tên người phụ trách" />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Điện thoại" value={fPhone} onChange={setFPhone} type="tel" placeholder="+33..." />
              <Input label="Email" value={fEmail} onChange={setFEmail} type="email" placeholder="email@..." />
            </div>
            <Input label="Thành phố" value={fCity} onChange={setFCity} placeholder="Paris" />
            <Textarea label="Ghi chú" value={fNotes} onChange={setFNotes} placeholder="Thông tin thêm..." minRows={2} maxRows={4} />
            <Button type="submit" variant="primary" fullWidth className="rounded-lg">
              {editingId ? 'Lưu thay đổi' : 'Thêm khách hàng'}
            </Button>
          </form>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <Building2 size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">{search ? 'Không tìm thấy kết quả' : 'Chưa có khách hàng nào'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filtered.map(client => {
            const clientEvents = events.filter(e => client.eventIds.includes(e.id));
            return (
              <div key={client.id} className="glass-card rounded-2xl p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--text-primary)] truncate">{client.name}</p>
                    {client.contactName && (
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-1">
                        <Check size={11} /> {client.contactName}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button onPress={() => openEdit(client)} variant="ghost" isIconOnly size="sm" className="rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"><Pencil size={14} /></Button>
                    <Button onPress={() => handleDelete(client.id)} variant="ghost" isIconOnly size="sm" className="rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)]"><Trash2 size={14} /></Button>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {client.phone && <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5"><Phone size={11} /> {client.phone}</p>}
                  {client.email && <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5"><Mail size={11} /> {client.email}</p>}
                  {client.city  && <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5"><MapPin size={11} /> {client.city}</p>}
                </div>
                {clientEvents.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[var(--glass-border)]">
                    <p className="text-xs text-[var(--text-muted)]">{clientEvents.length} sự kiện liên quan</p>
                  </div>
                )}
                {client.notes && <p className="text-xs text-[var(--text-muted)] mt-1.5 italic">{client.notes}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
