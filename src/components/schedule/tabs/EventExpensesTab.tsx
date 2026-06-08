import { useState, useRef } from 'react';
import { Plus, ChevronDown, ChevronUp, Upload, X, Loader, Image as ImageIcon } from 'lucide-react';
import DocThumbnail from '../../shared/DocThumbnail';
import { useApp } from '../../../context/AppContext';
import { ExpenseStatusBadge } from '../../shared/StatusBadge';
import { supabase } from '../../../lib/supabase';
import type { FestivalEvent, ExpenseCategory, Expense } from '../../../types';

interface Props {
  event: FestivalEvent;
}

const CATEGORIES: ExpenseCategory[] = ['Vé tàu/xe', 'Uber/Taxi', 'Ăn uống', 'Khác'];
const MAX_FILE_MB = 5;

export default function EventExpensesTab({ event }: Props) {
  const { state, addExpense, updateExpenseStatus } = useApp();
  const { currentUser, staff } = state;
  const isAdmin   = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const canViewAll = isAdmin || isManager;

  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);
  const [showFormForStaff, setShowFormForStaff] = useState<string | null>(null);

  const [formCategory, setFormCategory] = useState<ExpenseCategory>('Vé tàu/xe');
  const [formAmount, setFormAmount]     = useState('');
  const [formDate, setFormDate]         = useState('');
  const [expenseFile, setExpenseFile]   = useState<File | null>(null);
  const [uploading, setUploading]       = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tìm staff member của user đang đăng nhập
  // Thử match theo userId (UUID), sau đó fallback theo name
  const myStaffMember = currentUser
    ? (staff.find(s => s.userId === currentUser.id)
       ?? staff.find(s => s.name.toLowerCase() === currentUser.name.toLowerCase()))
    : null;
  const myNumericStaffId = myStaffMember ? String(myStaffMember.id) : null;

  const resetForm = () => {
    setFormCategory('Vé tàu/xe');
    setFormAmount('');
    setFormDate('');
    setExpenseFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !formAmount || !formDate) return;
    setUploading(true);
    try {
      let imageUrl = '';
      if (expenseFile) {
        if (expenseFile.size > MAX_FILE_MB * 1024 * 1024) {
          alert(`File quá lớn. Vui lòng chọn file dưới ${MAX_FILE_MB}MB.`);
          return;
        }
        const ext  = expenseFile.name.split('.').pop();
        const path = `staff-${myNumericStaffId}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('expenses').upload(path, expenseFile);
        if (error) throw error;
        imageUrl = supabase.storage.from('expenses').getPublicUrl(path).data.publicUrl;
      }
      const [yyyy, mm, dd] = formDate.split('-');
      const newExpense: Expense = {
        id: Date.now(),
        staffId: myNumericStaffId ?? currentUser.id,
        staffName: currentUser.name,
        festivalId: event.id,
        type: formCategory,
        amount: parseFloat(formAmount),
        date: `${dd}-${mm}-${yyyy}`,
        imageUrl,
        status: 'pending',
      };
      addExpense(event.id, newExpense);
      resetForm();
      setShowFormForStaff(null);
      // Giữ panel mở để thấy chi phí vừa nộp
      setExpandedStaff(myNumericStaffId);
    } catch (err: any) {
      alert(err?.message ?? 'Upload thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
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

  // Nếu staff chưa có chi phí nào, thêm entry rỗng để họ vẫn thấy tên mình
  if (!canViewAll && myNumericStaffId && currentUser && !byStaff[myNumericStaffId]) {
    byStaff[myNumericStaffId] = { name: currentUser.name, expenses: [] };
  }

  const toggle = (staffId: string) => {
    setExpandedStaff(prev => (prev === staffId ? null : staffId));
    setShowFormForStaff(null);
  };

  const totalAll = event.receipts.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {event.receipts.length} chi phí
          {totalAll > 0 && <span className="ml-2 font-medium text-gray-700 dark:text-gray-200">· {totalAll.toLocaleString('vi-VN')}€</span>}
        </p>
      </div>

      {Object.keys(byStaff).length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">Chưa có chi phí nào</p>
      ) : (
        <div className="space-y-2">
          {Object.entries(byStaff).map(([staffId, { name, expenses }]) => {
            const total        = expenses.reduce((s, e) => s + e.amount, 0);
            const pendingCount = expenses.filter(e => e.status === 'pending').length;
            const isOpen       = expandedStaff === staffId;
            const isMe         = !canViewAll && staffId === myNumericStaffId;
            const showForm     = showFormForStaff === staffId;

            return (
              <div key={staffId} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                {/* Header */}
                <button
                  className="w-full flex justify-between items-center px-4 py-3 text-left"
                  onClick={() => toggle(staffId)}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {name}
                      {isMe && <span className="ml-2 text-xs text-blue-500 font-normal">(bạn)</span>}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {expenses.length} chi phí{total > 0 && ` · ${total.toLocaleString('vi-VN')}€`}
                      {pendingCount > 0 && (
                        <span className="ml-2 text-yellow-600 font-medium">{pendingCount} chờ duyệt</span>
                      )}
                    </p>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-gray-400 dark:text-gray-500" /> : <ChevronDown size={16} className="text-gray-400 dark:text-gray-500" />}
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 dark:border-slate-700">
                    {/* Nút nộp chi phí — chỉ hiện cho chính nhân viên đó */}
                    {isMe && !showForm && (
                      <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                        <button
                          onClick={() => setShowFormForStaff(staffId)}
                          className="flex items-center gap-1 text-sm text-blue-600 font-medium"
                        >
                          <Plus size={15} /> Nộp chi phí mới
                        </button>
                      </div>
                    )}

                    {/* Form nộp chi phí inline */}
                    {isMe && showForm && (
                      <form onSubmit={handleSubmit} className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/50 space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Chi phí mới</p>
                          <button type="button" onClick={() => { setShowFormForStaff(null); resetForm(); }}>
                            <X size={15} className="text-gray-400 dark:text-gray-500" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">Loại</label>
                            <select className="mt-1 w-full border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-slate-700 dark:text-gray-100"
                              value={formCategory} onChange={e => setFormCategory(e.target.value as ExpenseCategory)}>
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">Số tiền (€)</label>
                            <input type="number" min="0" step="0.01" required
                              className="mt-1 w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-2 py-2 text-sm"
                              value={formAmount} onChange={e => setFormAmount(e.target.value)} />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">Ngày</label>
                          <input type="date" required
                            className="mt-1 w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:[color-scheme:dark] rounded-lg px-3 py-2 text-sm"
                            value={formDate} onChange={e => setFormDate(e.target.value)} />
                        </div>

                        {/* Upload ảnh hóa đơn */}
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-300 font-medium">Ảnh hóa đơn (không bắt buộc, tối đa 5MB)</label>
                          {expenseFile ? (
                            <div className="mt-1 flex items-center gap-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2">
                              <ImageIcon size={14} className="text-blue-500 shrink-0" />
                              <span className="text-xs text-gray-700 dark:text-gray-200 truncate flex-1">{expenseFile.name}</span>
                              <button type="button" onClick={() => { setExpenseFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                                <X size={13} className="text-gray-400 hover:text-red-500" />
                              </button>
                            </div>
                          ) : (
                            <label className="mt-1 flex items-center gap-2 border border-dashed border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2.5 cursor-pointer hover:border-blue-400 hover:bg-white dark:hover:bg-slate-700 transition">
                              <Upload size={14} className="text-gray-400" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">Chọn ảnh hoặc PDF</span>
                              <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden"
                                onChange={e => setExpenseFile(e.target.files?.[0] ?? null)} />
                            </label>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button type="submit" disabled={uploading}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-60">
                            {uploading && <Loader size={13} className="animate-spin" />}
                            {uploading ? 'Đang gửi...' : 'Gửi'}
                          </button>
                          <button type="button" onClick={() => { setShowFormForStaff(null); resetForm(); }}
                            className="flex-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-gray-600 dark:text-gray-300 py-2 rounded-lg">
                            Huỷ
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Danh sách chi phí */}
                    <div className="divide-y divide-gray-50 dark:divide-slate-700">
                      {expenses.length === 0 && (
                        <p className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">Chưa có chi phí nào</p>
                      )}
                      {expenses.map(r => (
                        <div key={r.id} className="px-4 py-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{r.type}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{r.date}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                              <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{r.amount}€</span>
                              <ExpenseStatusBadge status={r.status} />
                            </div>
                          </div>
                          {r.imageUrl && (
                            <div className="mt-2">
                              <DocThumbnail url={r.imageUrl} fileName="Hóa đơn" />
                            </div>
                          )}
                          {isAdmin && r.status === 'pending' && (
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => updateExpenseStatus(event.id, r.id, 'approved')}
                                className="flex-1 text-xs bg-green-50 text-green-700 font-medium py-1.5 rounded-lg border border-green-200 hover:bg-green-100">
                                Duyệt
                              </button>
                              <button onClick={() => updateExpenseStatus(event.id, r.id, 'rejected')}
                                className="flex-1 text-xs bg-red-50 text-red-600 font-medium py-1.5 rounded-lg border border-red-200 hover:bg-red-100">
                                Từ chối
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
