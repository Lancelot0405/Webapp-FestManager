import { useState } from 'react';
import { Plus, X, Pencil, Trash2, Phone, Mail, MapPin, Building2, Check, Search } from 'lucide-react';
import { Button, Card } from '@heroui/react';
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

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-300" />
        <input
          className="w-full pl-9 pr-3 py-2 border border-brand-200 dark:border-espresso-700 dark:bg-espresso-800 dark:text-espresso-50 dark:placeholder-gray-500 rounded-xl text-sm bg-white"
          placeholder="Tìm kiếm khách hàng..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {showForm && (
        <Card className="rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="font-semibold text-sm text-espresso-800 dark:text-espresso-50">{editingId ? 'Chỉnh sửa' : 'Thêm khách hàng mới'}</p>
            <Button onPress={() => { setShowForm(false); resetForm(); }} variant="ghost" isIconOnly size="sm"><X size={16} /></Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <Field label="Tên tổ chức *">
              <input required className="form-input" placeholder="Tên ban tổ chức / công ty" value={fName} onChange={e => setFName(e.target.value)} />
            </Field>
            <Field label="Người liên hệ">
              <input className="form-input" placeholder="Họ tên người phụ trách" value={fContactName} onChange={e => setFContactName(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Số điện thoại">
                <input className="form-input" type="tel" placeholder="+33..." value={fPhone} onChange={e => setFPhone(e.target.value)} />
              </Field>
              <Field label="Email">
                <input className="form-input" type="email" placeholder="email@..." value={fEmail} onChange={e => setFEmail(e.target.value)} />
              </Field>
            </div>
            <Field label="Thành phố">
              <input className="form-input" placeholder="Paris" value={fCity} onChange={e => setFCity(e.target.value)} />
            </Field>
            <Field label="Ghi chú">
              <textarea className="form-input resize-none h-16" placeholder="Thông tin thêm..." value={fNotes} onChange={e => setFNotes(e.target.value)} />
            </Field>
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
              <Card key={client.id} className="rounded-2xl p-4">
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-brand-600 dark:text-brand-300 mb-1 block">{label}</label>
      {children}
    </div>
  );
}
