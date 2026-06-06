// =============================================================================
// src/components/hr/StaffProfile.tsx
// =============================================================================

import { useState } from 'react';
import { ArrowLeft, FileText, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExpenseStatusBadge } from '../shared/StatusBadge';
import type { ExpenseCategory, Expense } from '../../types';

interface StaffProfileProps {
  staffId: number;
  onBack?: () => void;
}

const CATEGORIES: ExpenseCategory[] = ['Vé tàu/xe', 'Uber/Taxi', 'Ăn uống', 'Khác'];

export default function StaffProfile({ staffId, onBack }: StaffProfileProps) {
  const { state, addExpense } = useApp();
  const { staff, events, currentUser } = state;

  const member = staff.find(s => s.id === staffId);

  const [showForm, setShowForm] = useState(false);
  const [formEventId, setFormEventId] = useState<number | ''>('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('Vé tàu/xe');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState('');

  if (!member) return (
    <div className="text-center py-20 text-gray-400">
      <p>Không tìm thấy nhân viên</p>
      {onBack && <button onClick={onBack} className="mt-4 text-blue-600 text-sm">Quay lại</button>}
    </div>
  );

  // All expenses belonging to this staff across all events
  const allExpenses: (Expense & { eventName: string })[] = events.flatMap(e =>
    e.receipts
      .filter(r => r.staffId === staffId)
      .map(r => ({ ...r, eventName: e.name }))
  );

  // Events this staff is assigned to
  const myEvents = events.filter(e => e.staff.some(s => s.id === staffId));

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEventId || !formAmount || !formDate || !currentUser) return;
    const [yyyy, mm, dd] = formDate.split('-');
    const newExpense: Expense = {
      id: Date.now(),
      staffId: member.id,
      staffName: member.name,
      festivalId: formEventId as number,
      type: formCategory,
      amount: parseFloat(formAmount),
      date: `${dd}-${mm}-${yyyy}`,
      imageUrl: '',
      status: 'pending',
    };
    addExpense(formEventId as number, newExpense);
    setShowForm(false);
    setFormAmount('');
    setFormDate('');
    setFormEventId('');
  };

  return (
    <div className="space-y-5 pb-20">
      {onBack && (
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-bold text-gray-800">Hồ sơ nhân viên</h1>
        </div>
      )}

      {/* Profile info */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-2">
        <p className="text-lg font-bold text-gray-800">{member.name}</p>
        <Row label="Ngày sinh" value={member.dob} />
        <Row label="Thành phố" value={member.city} />
        <Row label="Sự kiện" value={`${myEvents.length} sự kiện`} />
      </div>

      {/* Contracts */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Hợp đồng ({member.contracts.length})</h2>
        {member.contracts.length === 0 ? (
          <p className="text-xs text-gray-400 py-3 text-center">Chưa có hợp đồng</p>
        ) : (
          <div className="space-y-2">
            {member.contracts.map(c => (
              <a
                key={c.id}
                href={c.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 shadow-sm hover:border-blue-200"
              >
                <FileText size={18} className="text-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{c.fileName ?? 'Hợp đồng'}</p>
                  <p className="text-xs text-gray-500">{c.date}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Expenses */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-semibold text-gray-700">Chi phí ({allExpenses.length})</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 text-blue-600 text-sm font-medium"
          >
            <Plus size={15} />
            Nộp chi phí
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmitExpense}
            className="bg-blue-50 rounded-xl p-4 space-y-3 border border-blue-100 mb-3"
          >
            <p className="text-sm font-semibold text-blue-700">Nộp chi phí mới</p>
            <div>
              <label className="text-xs text-gray-600 font-medium">Sự kiện</label>
              <select
                required
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={formEventId}
                onChange={e => setFormEventId(Number(e.target.value))}
              >
                <option value="">Chọn sự kiện</option>
                {myEvents.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium">Loại chi phí</label>
              <select
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={formCategory}
                onChange={e => setFormCategory(e.target.value as ExpenseCategory)}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium">Số tiền (€)</label>
              <input
                type="number" min="0" step="0.01" required
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium">Ngày</label>
              <input
                type="date" required
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 rounded-lg">Gửi</button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-white border border-gray-200 text-sm text-gray-600 py-2 rounded-lg">Huỷ</button>
            </div>
          </form>
        )}

        {allExpenses.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">Chưa có chi phí</p>
        ) : (
          <div className="space-y-2">
            {allExpenses.map(exp => (
              <div key={exp.id} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{exp.type}</p>
                    <p className="text-xs text-gray-500">{exp.eventName} · {exp.date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold text-gray-700">{exp.amount}€</span>
                    <ExpenseStatusBadge status={exp.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}
