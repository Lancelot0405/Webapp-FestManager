import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, ChevronDown, ChevronUp, Upload, X, Loader, Image as ImageIcon } from 'lucide-react';
import { Button } from '@heroui/react';
import DocThumbnail from '../../shared/DocThumbnail';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import { ExpenseStatusBadge } from '../../shared/StatusBadge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { supabase } from '../../../lib/supabase';
import { getErrorMessage } from '../../../lib/errors';
import { expenseFormSchema } from '../../../lib/validations';
import type { FestivalEvent, ExpenseCategory, Expense } from '../../../types';
import { z } from 'zod';

type ExpenseFormInputs = z.infer<typeof expenseFormSchema>;

interface Props {
  event: FestivalEvent;
}

const CATEGORIES: ExpenseCategory[] = ['Vé tàu/xe', 'Uber/Taxi', 'Ăn uống', 'Khác'];
const CATEGORY_OPTIONS = CATEGORIES.map(c => ({ value: c, label: c }));
const MAX_FILE_MB = 5;

export default function EventExpensesTab({ event }: Props) {
  const { state, addExpense, updateExpenseStatus } = useApp();
  const showToast = useToast();
  const { currentUser, staff } = state;
  const isAdmin   = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const canViewAll = isAdmin || isManager;

  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);
  const [showFormForStaff, setShowFormForStaff] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormInputs>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      type: 'Vé tàu/xe',
      amount: '',
      date: '',
    },
  });

  const formCategory = watch('type');
  const [expenseFile, setExpenseFile]   = useState<File | null>(null);
  const [uploading, setUploading]       = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myStaffMember = currentUser
    ? (staff.find(s => s.userId === currentUser.id)
       ?? staff.find(s => s.name.toLowerCase() === currentUser.name.toLowerCase()))
    : null;
  const myNumericStaffId = myStaffMember ? String(myStaffMember.id) : null;

  const resetForm = () => {
    reset({
      type: 'Vé tàu/xe',
      amount: '',
      date: '',
    });
    setExpenseFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: ExpenseFormInputs) => {
    if (!currentUser) return;
    setUploading(true);
    try {
      let imageUrl = '';
      if (expenseFile) {
        if (expenseFile.size > MAX_FILE_MB * 1024 * 1024) {
          showToast(`File quá lớn. Vui lòng chọn file dưới ${MAX_FILE_MB}MB.`, 'warning');
          setUploading(false);
          return;
        }
        const ext  = expenseFile.name.split('.').pop();
        const path = `staff-${myNumericStaffId}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('expenses').upload(path, expenseFile);
        if (error) throw error;
        imageUrl = supabase.storage.from('expenses').getPublicUrl(path).data.publicUrl;
      }
      const [yyyy, mm, dd] = data.date.split('-');
      const newExpense: Expense = {
        id: Date.now(),
        staffId: myNumericStaffId ?? currentUser.id,
        staffName: currentUser.name,
        festivalId: event.id,
        type: data.type,
        amount: parseFloat(data.amount),
        date: `${dd}-${mm}-${yyyy}`,
        imageUrl,
        status: 'pending',
      };
      addExpense(event.id, newExpense);
      resetForm();
      setShowFormForStaff(null);
      setExpandedStaff(myNumericStaffId);
    } catch (err) {
      showToast(getErrorMessage(err, 'Upload thất bại. Vui lòng thử lại.'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const byStaff = event.receipts.reduce<Record<string, { name: string; expenses: Expense[] }>>(
    (acc, r) => {
      if (!acc[r.staffId]) acc[r.staffId] = { name: r.staffName, expenses: [] };
      acc[r.staffId].expenses.push(r);
      return acc;
    },
    {}
  );

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
        <p className="text-sm text-[var(--text-muted)]">
          {event.receipts.length} chi phí
          {totalAll > 0 && <span className="ml-2 font-semibold text-[var(--text-secondary)]">· {totalAll.toLocaleString('vi-VN')}€</span>}
        </p>
      </div>

      {Object.keys(byStaff).length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-8">Chưa có chi phí nào</p>
      ) : (
        <div className="space-y-2">
          {Object.entries(byStaff).map(([staffId, { name, expenses }]) => {
            const total        = expenses.reduce((s, e) => s + e.amount, 0);
            const pendingCount = expenses.filter(e => e.status === 'pending').length;
            const isOpen       = expandedStaff === staffId;
            const isMe         = !canViewAll && staffId === myNumericStaffId;
            const showForm     = showFormForStaff === staffId;

            return (
              <div key={staffId} className="glass-card rounded-xl overflow-hidden">
                {/* Header */}
                <Button
                  variant="ghost"
                  className="w-full h-auto justify-between rounded-none px-4 py-3 text-left"
                  onPress={() => toggle(staffId)}
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {name}
                      {isMe && <span className="ml-2 text-xs text-[var(--primary)] font-normal">(bạn)</span>}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {expenses.length} chi phí{total > 0 && ` · ${total.toLocaleString('vi-VN')}€`}
                      {pendingCount > 0 && (
                        <span className="ml-2 text-[var(--warning)] font-semibold">{pendingCount} chờ duyệt</span>
                      )}
                    </p>
                  </div>
                  {isOpen
                    ? <ChevronUp size={16} className="text-[var(--text-muted)]" />
                    : <ChevronDown size={16} className="text-[var(--text-muted)]" />
                  }
                </Button>

                {isOpen && (
                  <div className="border-t border-[var(--glass-border)]">
                    {/* Nút nộp chi phí */}
                    {isMe && !showForm && (
                      <div className="px-4 py-2 bg-[var(--glass-bg)] border-b border-[var(--glass-border)]">
                        <Button
                          variant="ghost"
                          onPress={() => setShowFormForStaff(staffId)}
                          className="h-auto min-w-0 p-0 flex items-center gap-1 text-sm text-[var(--primary)] font-semibold"
                        >
                          <Plus size={15} /> Nộp chi phí mới
                        </Button>
                      </div>
                    )}

                    {/* Form nộp chi phí inline */}
                    {isMe && showForm && (
                      <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-3 bg-[var(--glass-bg)] border-b border-[var(--glass-border)] space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-bold text-[var(--text-secondary)]">Chi phí mới</p>
                          <Button isIconOnly variant="ghost" onPress={() => { setShowFormForStaff(null); resetForm(); }} aria-label="Đóng" className="h-auto min-w-0 p-0">
                            <X size={15} className="text-[var(--text-muted)]" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            label="Loại"
                            value={formCategory}
                            onChange={(v) => setValue('type', v as ExpenseCategory, { shouldValidate: true })}
                            options={CATEGORY_OPTIONS}
                          />
                          <Input
                            type="number" min={0} step={0.01}
                            label="Số tiền (€)"
                            error={errors.amount?.message}
                            {...register('amount')}
                            onChange={(v) => setValue('amount', v, { shouldValidate: true })}
                          />
                        </div>

                        <Input
                          type="date"
                          label="Ngày"
                          error={errors.date?.message}
                          {...register('date')}
                          onChange={(v) => setValue('date', v, { shouldValidate: true })}
                        />

                        {/* Upload ảnh hóa đơn */}
                        <div>
                          <label className="text-xs text-[var(--text-secondary)] font-semibold">Ảnh hóa đơn (không bắt buộc, tối đa 5MB)</label>
                          {expenseFile ? (
                            <div className="mt-1 flex items-center gap-2 border border-[var(--glass-border)] bg-[var(--glass-bg)] rounded-xl px-3 py-2">
                              <ImageIcon size={14} className="text-[var(--primary)] shrink-0" />
                              <span className="text-xs text-[var(--text-primary)] truncate flex-1">{expenseFile.name}</span>
                              <Button isIconOnly variant="ghost" onPress={() => { setExpenseFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} aria-label="Xóa ảnh" className="h-auto min-w-0 p-0">
                                <X size={13} className="text-[var(--text-muted)] hover:text-[var(--danger)]" />
                              </Button>
                            </div>
                          ) : (
                            <label className="mt-1 flex items-center gap-2 border border-dashed border-[var(--glass-border)] rounded-xl px-3 py-2.5 cursor-pointer hover:border-[var(--primary)]/40 hover:bg-[var(--glass-bg)] transition-colors">
                              <Upload size={14} className="text-[var(--text-muted)]" />
                              <span className="text-xs text-[var(--text-muted)]">Chọn ảnh hoặc PDF</span>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={e => setExpenseFile(e.target.files?.[0] ?? null)}
                              />
                            </label>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            isDisabled={uploading}
                            className="flex-1 h-auto flex items-center justify-center gap-1.5 bg-[var(--primary)] text-[var(--background)] text-sm font-semibold py-2 rounded-xl disabled:opacity-60 transition-opacity"
                          >
                            {uploading && <Loader size={13} className="animate-spin" />}
                            {uploading ? 'Đang gửi...' : 'Gửi'}
                          </Button>
                          <Button
                            variant="ghost"
                            onPress={() => { setShowFormForStaff(null); resetForm(); }}
                            className="flex-1 h-auto border border-[var(--glass-border)] bg-[var(--glass-bg)] text-sm text-[var(--text-secondary)] py-2 rounded-xl transition-colors"
                          >
                            Huỷ
                          </Button>
                        </div>
                      </form>
                    )}

                    {/* Danh sách chi phí */}
                    <div className="divide-y divide-[var(--glass-border)]">
                      {expenses.length === 0 && (
                        <p className="px-4 py-3 text-xs text-[var(--text-muted)]">Chưa có chi phí nào</p>
                      )}
                      {expenses.map(r => (
                        <div key={r.id} className="px-4 py-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[var(--text-primary)]">{r.type}</p>
                              <p className="text-xs text-[var(--text-muted)]">{r.date}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                              <span className="text-sm font-bold text-[var(--text-primary)]">{r.amount}€</span>
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
                              <Button
                                variant="ghost"
                                onPress={() => updateExpenseStatus(event.id, r.id, 'approved')}
                                className="flex-1 h-auto text-xs bg-[var(--success)]/10 text-[var(--success)] font-semibold py-1.5 rounded-xl border border-[var(--success)]/20 hover:bg-[var(--success)]/20 transition-colors"
                              >
                                Duyệt
                              </Button>
                              <Button
                                variant="ghost"
                                onPress={() => updateExpenseStatus(event.id, r.id, 'rejected')}
                                className="flex-1 h-auto text-xs bg-[var(--danger)]/10 text-[var(--danger)] font-semibold py-1.5 rounded-xl border border-[var(--danger)]/20 hover:bg-[var(--danger)]/20 transition-colors"
                              >
                                Từ chối
                              </Button>
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
