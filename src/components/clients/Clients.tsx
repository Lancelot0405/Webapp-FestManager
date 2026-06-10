import { useState } from 'react';
import { Plus, X, Pencil, Trash2, Phone, Mail, MapPin, Building2, Check, Search } from 'lucide-react';
import { Button, Card } from '@heroui/react';
import { Input } from '@/components/ui/input';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import type { Client } from '../../types';

export default function Clients() {
  const { state, addClient, updateClient, deleteClient } = useApp();
  const showToast = useToast();
  const { clients, events } = state;

  const [search, setSearch] = useState('');
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
    setFName(client.name);
    setFContactName(client.contactName);
    setFPhone(client.phone);
    setFEmail(client.email);
    setFCity(client.city);
    setFNotes(client.notes);
    setEditingId(client.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim()) return;
    if (editingId !== null) {
      const existing = clients.find(c => c.id === editingId)!;
      updateClient({ ...existing, name: fName.trim(), contactName: fContactName.trim(), phone: fPhone.trim(), email: fEmail.trim(), city: fCity.trim(), notes: fNotes.trim() });
      showToast('Đã cập nhật khách hàng', 'success');
    } else {
      addClient({ id: Date.now(), name: fName.trim(), contactName: fContactName.trim(), phone: fPhone.trim(), email: fEmail.trim(), city: fCity.trim(), notes: fNotes.trim(), eventIds: [] });
      showToast('Đã thêm khách hàng', 'success');
    }
    setShowForm(false);
    resetForm();
  };

  const handleDelete = (id: number) => {
    if (!confirm('Xóa khách hàng này?')) return;
    deleteClient(id);
    showToast('Đã xóa', 'info');
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase()) ||
    c.contactName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-espresso-800 dark:text-espresso-50">Khách hàng</h1>
        <Button onPress={openAdd} variant="primary" size="sm" className="flex items-center gap-1.5 rounded-xl">
          <Plus size={15} /> Thêm
        </Button>
      </div>

      <Input
        placeholder="Tìm kiếm khách hàng..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        icon={<Search size={15} />}
      />

      {showForm && (
        <Card className="rounded-xl p-4 bg-white dark:bg-slate-800">
          <div className="flex justify-between items-center mb-3">
            <p className="font-semibold text-sm text-espresso-800 dark:text-espresso-50">{editingId ? 'Chỉnh sửa' : 'Thêm khách hàng mới'}</p>
            <Button onPress={() => { setShowForm(false); resetForm(); }} variant="ghost" isIconOnly size="sm"><X size={16} /></Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <Input label="Tên tổ chức *" required placeholder="Tên ban tổ chức / công ty" value={fName} onChange={e => setFName(e.target.value)} />
            <Input label="Người liên hệ" placeholder="Họ tên người phụ trách" value={fContactName} onChange={e => setFContactName(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Số điện thoại" type="tel" placeholder="+33..." value={fPhone} onChange={e => setFPhone(e.target.value)} />
              <Input label="Email" type="email" placeholder="email@..." value={fEmail} onChange={e => setFEmail(e.target.value)} />
            </div>
            <Input label="Thành phố" placeholder="Paris" value={fCity} onChange={e => setFCity(e.target.value)} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[var(--text-primary)]">Ghi chú</label>
              <textarea
                className="h-9 w-full rounded-md border border-[var(--border-color)] bg-transparent px-3 py-1 text-base text-[var(--text-primary)] shadow-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none h-16"
                placeholder="Thông tin thêm..."
                value={fNotes}
                onChange={e => setFNotes(e.target.value)}
              />
            </div>
            <Button type="submit" variant="primary" fullWidth className="rounded-lg">
              {editingId ? 'Lưu thay đổi' : 'Thêm khách hàng'}
            </Button>
          </form>
        </Card>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-brand-300">
          <Building2 size={36} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">{search ? 'Không tìm thấy kết quả' : 'Chưa có khách hàng nào'}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(client => {
            const clientEvents = events.filter(e => client.eventIds.includes(e.id));
            return (
              <Card key={client.id} className="rounded-2xl p-4 bg-white dark:bg-slate-800">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-espresso-800 dark:text-espresso-50 truncate">{client.name}</p>
                    {client.contactName && (
                      <p className="text-xs text-brand-400 dark:text-brand-300 mt-0.5 flex items-center gap-1">
                        <Check size={11} /> {client.contactName}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5 ml-2">
                    <Button onPress={() => openEdit(client)} variant="ghost" isIconOnly size="sm" className="rounded-lg text-brand-300 hover:text-brand-600">
                      <Pencil size={14} />
                    </Button>
                    <Button onPress={() => handleDelete(client.id)} variant="ghost" isIconOnly size="sm" className="rounded-lg text-brand-300 hover:text-red-500">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {client.phone && <p className="text-xs text-brand-400 dark:text-brand-300 flex items-center gap-1.5"><Phone size={11} /> {client.phone}</p>}
                  {client.email && <p className="text-xs text-brand-400 dark:text-brand-300 flex items-center gap-1.5"><Mail size={11} /> {client.email}</p>}
                  {client.city  && <p className="text-xs text-brand-400 dark:text-brand-300 flex items-center gap-1.5"><MapPin size={11} /> {client.city}</p>}
                </div>
                {clientEvents.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-50 dark:border-espresso-700">
                    <p className="text-xs text-brand-300 dark:text-brand-400">{clientEvents.length} sự kiện liên quan</p>
                  </div>
                )}
                {client.notes && (
                  <p className="text-xs text-brand-300 dark:text-brand-400 mt-1.5 italic">{client.notes}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

