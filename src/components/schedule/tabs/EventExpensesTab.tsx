import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Image } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { ExpenseStatusBadge } from '../../shared/StatusBadge';
import type { FestivalEvent, ExpenseCategory, Expense } from '../../../types';

interface Props {
  event: FestivalEvent;
}

const CATEGORIES: ExpenseCategory[] = ['Vé tàu/xe', 'Uber/Taxi', 'Ăn uống', 'Khác'];

export default function EventExpensesTab({ event }: Props) {
  const { state, addExpense, updateExpenseStatus } = useApp();
  const { currentUser } = state;
  const isAdmin = currentUser?.role === 'admin';
  const [showForm, setShowForm] = useState(false);
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);

  const [formCategory, setFormCategory] = useState<ExpenseCategory>('Vé tàu/xe');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !formAmount || !formDate) return;
    const [yyyy, mm, dd] = formDate.split('-');
    const newExpense: Expense = {
      id: Date.now(),
      staffId: currentUser.id,
      staffName: currentUser.name,
      festivalId: event.id,
      type: formCategory,
      amount: parseFloat(formAmount),
      date: `${dd}-${mm}-${yyyy}`,
      imageUrl: '',
      status: 'pending',
    };
    addExpense(event.id, newExpense);
    setShowForm(false);
    setFormAmount('');
    setFormDate('');
  };

  // Group expenses by staff
  const byStaff = event.receipts.reduce<Record<string, { name: string; expenses: Expense[] }>>(
    (acc, r) => {
      if (!acc[r.staffId]) acc[r.staffId] = { name: r.staffName, expenses: [] };
      acc[r.staffId].expenses.push(r);
      return acc;
    },
    {}
  );

  const toggle = (staffId: string) =>
    setExpandedStaff(prev => (prev === staffId ? null : staffId));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{event.receipts.length} chi phí</p>
        {!isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 text-blue-600 text-sm font-medium"
          >
            <Plus size={16} />
            Nộp chi phí
          </button>
        )}
      </div>

      {showForm && !isAdmin && (
        <form
          onSubmit={handleSubmit}
          className="bg-blue-50 rounded-xl p-4 space-y-3 border border-blue-100"
        >
          <p className="text-sm font-semibold text-blue-700">Nộp chi phí mới</p>
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
              placeholder="0"
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
            <button type="submit"
              className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 rounded-lg">
              Gửi
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 bg-white border border-gray-200 text-sm text-gray-600 py-2 rounded-lg">
              Huỷ
            </button>
          </div>
        </form>
      )}

      {event.receipts.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Chưa có chi phí nào</p>
      ) : (
        <div className="space-y-2">
          {Object.entries(byStaff).map(([staffId, { name, expenses }]) => {
            const total = expenses.reduce((s, e) => s + e.amount, 0);
            const pendingCount = expenses.filter(e => e.status === 'pending').length;
            const isOpen = expandedStaff === staffId;

            return (
              <div key={staffId} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header — bấm để mở/đóng */}
                <button
                  className="w-full flex justify-between items-center px-4 py-3 text-left"
                  onClick={() => toggle(staffId)}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{name}</p>
                    <p className="text-xs text-gray-500">
                      {expenses.length} chi phí · {total.toLocaleString('vi-VN')}€
                      {pendingCount > 0 && (
                        <span className="ml-2 text-yellow-600 font-medium">{pendingCount} chờ duyệt</span>
                      )}
                    </p>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {/* Chi tiết từng chi phí */}
                {isOpen && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {expenses.map(r => (
                      <div key={r.id} className="px-4 py-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{r.type}</p>
                            <p className="text-xs text-gray-500">{r.date}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                            <span className="text-sm font-bold text-gray-800">{r.amount}€</span>
                            <ExpenseStatusBadge status={r.status} />
                          </div>
                        </div>
                        {r.imageUrl && (
                          <a href={r.imageUrl} target="_blank" rel="noreferrer"
                            className="mt-1.5 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700">
                            <Image size={12} /> Xem hóa đơn
                          </a>
                        )}
                        {isAdmin && r.status === 'pending' && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => updateExpenseStatus(event.id, r.id, 'approved')}
                              className="flex-1 text-xs bg-green-50 text-green-700 font-medium py-1.5 rounded-lg border border-green-200 hover:bg-green-100"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => updateExpenseStatus(event.id, r.id, 'rejected')}
                              className="flex-1 text-xs bg-red-50 text-red-600 font-medium py-1.5 rounded-lg border border-red-200 hover:bg-red-100"
                            >
                              Từ chối
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
