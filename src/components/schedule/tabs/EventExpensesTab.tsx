import { useState, useRef } from 'react';
import { Plus, ChevronDown, ChevronUp, Upload, X, Image as ImageIcon, Receipt, Loader2 } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DocThumbnail from '../../shared/DocThumbnail';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import { ExpenseStatusBadge } from '../../shared/StatusBadge';
import AppDatePicker from '@/components/shared/AppDatePicker';
import { supabase } from '../../../lib/supabase';
import { getErrorMessage } from '../../../lib/errors';
import { useStaffQuery } from '../../../hooks/queries/useStaffQuery';
import { useAddExpense } from '../../../hooks/queries/mutations/useAddExpense';
import { useUpdateExpenseStatus } from '../../../hooks/queries/mutations/useUpdateExpenseStatus';
import { expenseSchema } from '../../../lib/validations';
import type { FestivalEvent, ExpenseCategory, Expense } from '../../../types';

interface Props {
  event: FestivalEvent;
}

const CATEGORIES: ExpenseCategory[] = ['Vé tàu/xe', 'Uber/Taxi', 'Ăn uống', 'Khác'];
const CATEGORY_OPTIONS = CATEGORIES.map(c => ({ value: c, label: c }));
const MAX_FILE_MB = 5;

type FormValues = z.infer<typeof expenseSchema>;

export default function EventExpensesTab({ event }: Props) {
  const { currentUser } = useApp();
  const showToast = useToast();
  const { data: staff = [] } = useStaffQuery();
  const addExpenseMutation = useAddExpense();
  const updateExpenseStatusMutation = useUpdateExpenseStatus();

  const isAdmin   = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const canViewAll = isAdmin || isManager;

  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);
  const [showFormForStaff, setShowFormForStaff] = useState<string | null>(null);
  const [expenseFile, setExpenseFile]   = useState<File | null>(null);
  const [uploading, setUploading]       = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { category: 'Vé tàu/xe', amount: '', date: '' },
  });

  const myStaffMember = currentUser
    ? (staff.find(s => s.userId === currentUser.id)
       ?? staff.find(s => s.name.toLowerCase() === currentUser.name.toLowerCase()))
    : null;
  const myNumericStaffId = myStaffMember ? String(myStaffMember.id) : null;

  const resetForm = () => {
    reset({ category: 'Vé tàu/xe', amount: '', date: '' });
    setExpenseFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: FormValues) => {
    if (!currentUser) return;
    setUploading(true);
    try {
      let imageUrl = '';
      if (expenseFile) {
        if (expenseFile.size > MAX_FILE_MB * 1024 * 1024) {
          showToast(`File quá lớn. Vui lòng chọn file dưới ${MAX_FILE_MB}MB.`, 'warning');
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
        type: data.category,
        amount: parseFloat(data.amount),
        date: `${dd}-${mm}-${yyyy}`,
        imageUrl,
        status: 'pending',
      };
      addExpenseMutation.mutate({ eventId: event.id, expense: newExpense });
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
        <p className="text-sm text-muted-foreground">
          {event.receipts.length} chi phí
          {totalAll > 0 && <span className="ml-2 font-semibold text-foreground/80">· {totalAll.toLocaleString('vi-VN')}€</span>}
        </p>
      </div>

      {Object.keys(byStaff).length === 0 ? (
        <EmptyState icon={<Receipt size={24} />} title="Chưa có chi phí nào" />
      ) : (
        <div className="space-y-2">
          {Object.entries(byStaff).map(([staffId, { name, expenses }]) => {
            const total        = expenses.reduce((s, e) => s + e.amount, 0);
            const pendingCount = expenses.filter(e => e.status === 'pending').length;
            const isOpen       = expandedStaff === staffId;
            const isMe         = !canViewAll && staffId === myNumericStaffId;
            const showForm     = showFormForStaff === staffId;

            return (
              <Card key={staffId} className="p-0 overflow-hidden border shadow-sm bg-surface">
                {/* Header */}
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-auto justify-between rounded-none px-4 py-3 text-left hover:bg-muted/30"
                  onClick={() => toggle(staffId)}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {name}
                      {isMe && <span className="ml-2 text-xs text-accent font-normal">(bạn)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {expenses.length} chi phí{total > 0 && ` · ${total.toLocaleString('vi-VN')}€`}
                      {pendingCount > 0 && (
                        <span className="ml-2 text-warning font-semibold">{pendingCount} chờ duyệt</span>
                      )}
                    </p>
                  </div>
                  {isOpen
                    ? <ChevronUp size={16} className="text-muted-foreground shrink-0" />
                    : <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                  }
                </Button>

                {isOpen && (
                  <div className="border-t border-border">
                    {/* Nút nộp chi phí */}
                    {isMe && !showForm && (
                      <div className="px-4 py-2 bg-muted/20 border-b border-border">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setShowFormForStaff(staffId)}
                          className="h-auto min-w-0 p-0 flex items-center gap-1 text-sm text-accent hover:text-accent/90 hover:bg-transparent font-semibold"
                        >
                          <Plus size={15} /> Nộp chi phí mới
                        </Button>
                      </div>
                    )}

                    {/* Form nộp chi phí inline */}
                    {isMe && showForm && (
                      <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-3 bg-muted/20 border-b border-border space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-bold text-foreground/80">Chi phí mới</p>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => { setShowFormForStaff(null); resetForm(); }}
                            aria-label="Đóng"
                            className="h-7 w-7 p-0 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
                          >
                            <X size={15} />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Controller
                            name="category"
                            control={control}
                            render={({ field }) => (
                              <div className="w-full flex flex-col gap-1">
                                <Label className="text-xs font-medium text-foreground/80">Loại</Label>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger className="w-full h-9">
                                    <SelectValue placeholder="Chọn loại" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CATEGORY_OPTIONS.map(opt => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {errors.category && <p className="text-xs text-destructive mt-0.5">{errors.category.message}</p>}
                              </div>
                            )}
                          />
                          <Controller
                            name="amount"
                            control={control}
                            render={({ field }) => (
                              <div className="w-full flex flex-col gap-1">
                                <Label className="text-xs font-medium text-foreground/80">Số tiền (€)</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={field.value}
                                  onChange={(e) => field.onChange(e.target.value)}
                                />
                                {errors.amount && <p className="text-xs text-destructive mt-0.5">{errors.amount.message}</p>}
                              </div>
                            )}
                          />
                        </div>

                        <Controller
                          name="date"
                          control={control}
                          render={({ field }) => (
                            <AppDatePicker
                              label="Ngày"
                              value={field.value}
                              onChange={field.onChange}
                              error={errors.date?.message}
                            />
                          )}
                        />

                        {/* Upload ảnh hóa đơn */}
                        <div>
                          <label className="text-xs text-foreground/80 font-semibold mb-1 block">Ảnh hóa đơn (không bắt buộc, tối đa 5MB)</label>
                          {expenseFile ? (
                            <div className="mt-1 flex items-center gap-2 border border-border bg-muted/40 rounded-xl px-3 py-2">
                              <ImageIcon size={14} className="text-accent shrink-0" />
                              <span className="text-xs text-foreground truncate flex-1">{expenseFile.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => { setExpenseFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                aria-label="Xóa ảnh"
                                className="h-6 w-6 p-0 rounded-full flex items-center justify-center text-muted-foreground hover:text-danger"
                              >
                                <X size={13} />
                              </Button>
                            </div>
                          ) : (
                            <label className="mt-1 flex items-center gap-2 border border-dashed border-border rounded-xl px-3 py-2.5 cursor-pointer hover:border-accent/40 hover:bg-muted/40 transition-colors">
                              <Upload size={14} className="text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Chọn ảnh hoặc PDF</span>
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
                            disabled={uploading}
                            className="flex-1 h-9 rounded-xl font-semibold"
                          >
                            {uploading && <Loader2 className="size-4 animate-spin mr-1.5" />}
                            {uploading ? 'Đang gửi...' : 'Gửi'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => { setShowFormForStaff(null); resetForm(); }}
                            className="flex-1 h-9 border border-border bg-muted/40 rounded-xl font-semibold transition-colors"
                          >
                            Huỷ
                          </Button>
                        </div>
                      </form>
                    )}

                    {/* Danh sách chi phí */}
                    <div className="divide-y divide-border">
                      {expenses.length === 0 && (
                        <p className="px-4 py-3 text-xs text-muted-foreground">Chưa có chi phí nào</p>
                      )}
                      {expenses.map(r => (
                        <div key={r.id} className="px-4 py-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground">{r.type}</p>
                              <p className="text-xs text-muted-foreground">{r.date}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                              <span className="text-sm font-bold text-foreground">{r.amount}€</span>
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
                                type="button"
                                variant="ghost"
                                onClick={() => updateExpenseStatusMutation.mutate({ eventId: event.id, expenseId: r.id, status: 'approved' })}
                                className="flex-1 h-8 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold py-1.5 rounded-xl border border-emerald-500/20 transition-colors"
                              >
                                Duyệt
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => updateExpenseStatusMutation.mutate({ eventId: event.id, expenseId: r.id, status: 'rejected' })}
                                className="flex-1 h-8 text-xs bg-destructive/10 hover:bg-destructive/20 text-destructive font-semibold py-1.5 rounded-xl border border-destructive/20 transition-colors"
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
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
