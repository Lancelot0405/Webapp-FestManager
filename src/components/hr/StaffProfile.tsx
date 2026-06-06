import { useState, useRef } from 'react';
import { ArrowLeft, FileText, Plus, Upload, Image, X, Loader } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExpenseStatusBadge } from '../shared/StatusBadge';
import { supabase } from '../../lib/supabase';
import type { ExpenseCategory, Expense } from '../../types';

interface StaffProfileProps {
  staffId: string;
  onBack?: () => void;
}

const CATEGORIES: ExpenseCategory[] = ['Vé tàu/xe', 'Uber/Taxi', 'Ăn uống', 'Khác'];

export default function StaffProfile({ staffId, onBack }: StaffProfileProps) {
  const { state, addExpense, addContract } = useApp();
  const { staff, events, currentUser } = state;

  const member = staff.find(s => String(s.id) === staffId);

  // Form chi phí
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [formEventId,   setFormEventId]   = useState<number | ''>('');
  const [formCategory,  setFormCategory]  = useState<ExpenseCategory>('Vé tàu/xe');
  const [formAmount,    setFormAmount]    = useState('');
  const [formDate,      setFormDate]      = useState('');
  const [expenseFile,   setExpenseFile]   = useState<File | null>(null);
  const [uploadingExp,  setUploadingExp]  = useState(false);
  // Upload hợp đồng
  const [uploadingContract, setUploadingContract] = useState(false);
  const contractFileRef = useRef<HTMLInputElement>(null);

  if (!member) return (
    <div className="text-center py-20 text-gray-400">
      <p>Không tìm thấy nhân viên</p>
      {onBack && <button onClick={onBack} className="mt-4 text-blue-600 text-sm">Quay lại</button>}
    </div>
  );

  const allExpenses: (Expense & { eventName: string })[] = events.flatMap(e =>
    e.receipts
      .filter(r => r.staffId === staffId)
      .map(r => ({ ...r, eventName: e.name }))
  );
  const myEvents = events.filter(e => e.staff.some(s => String(s.id) === staffId));

  // Upload file lên Supabase Storage
  const uploadFile = async (file: File, bucket: string, folder: string) => {
    const ext  = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  // Upload hợp đồng
  const handleContractUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingContract(true);
    try {
      const url = await uploadFile(file, 'contracts', `staff-${member.id}`);
      addContract(member.id, {
        id: Date.now(),
        date: new Date().toLocaleDateString('fr-FR').replace(/\//g, '-'),
        url,
        fileName: file.name,
      });
    } catch {
      alert('Upload thất bại. Vui lòng thử lại.');
    } finally {
      setUploadingContract(false);
      if (contractFileRef.current) contractFileRef.current.value = '';
    }
  };

  // Gửi chi phí kèm ảnh
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEventId || !formAmount || !formDate || !currentUser) return;
    setUploadingExp(true);
    try {
      let imageUrl = '';
      if (expenseFile) {
        imageUrl = await uploadFile(expenseFile, 'expenses', `staff-${member.id}`);
      }
      const [yyyy, mm, dd] = formDate.split('-');
      const newExpense: Expense = {
        id: Date.now(),
        staffId: String(member.id),
        staffName: member.name,
        festivalId: formEventId as number,
        type: formCategory,
        amount: parseFloat(formAmount),
        date: `${dd}-${mm}-${yyyy}`,
        imageUrl,
        status: 'pending',
      };
      addExpense(formEventId as number, newExpense);
      setShowExpenseForm(false);
      setFormAmount(''); setFormDate(''); setFormEventId(''); setExpenseFile(null);
    } catch {
      alert('Upload ảnh thất bại. Vui lòng thử lại.');
    } finally {
      setUploadingExp(false);
    }
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

      {/* Thông tin cơ bản */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-2">
        <p className="text-lg font-bold text-gray-800">{member.name}</p>
        <Row label="Ngày sinh" value={member.dob} />
        <Row label="Thành phố" value={member.city} />
        <Row label="Sự kiện"   value={`${myEvents.length} sự kiện`} />
      </div>

      {/* ── HỢP ĐỒNG ────────────────────────────────────────────────────── */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-semibold text-gray-700">Hợp đồng ({member.contracts.length})</h2>
          <label className={`flex items-center gap-1 text-sm font-medium cursor-pointer px-3 py-1.5 rounded-lg transition
            ${uploadingContract ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
            {uploadingContract ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploadingContract ? 'Đang upload...' : 'Upload hợp đồng'}
            <input
              ref={contractFileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              disabled={uploadingContract}
              onChange={handleContractUpload}
            />
          </label>
        </div>

        {member.contracts.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center bg-white rounded-xl border border-dashed border-gray-200">
            Chưa có hợp đồng — bấm "Upload hợp đồng" để thêm
          </p>
        ) : (
          <div className="space-y-2">
            {member.contracts.map(c => (
              <a key={c.id} href={c.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 shadow-sm hover:border-blue-200">
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

      {/* ── CHI PHÍ ─────────────────────────────────────────────────────── */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-semibold text-gray-700">Chi phí ({allExpenses.length})</h2>
          <button
            onClick={() => setShowExpenseForm(!showExpenseForm)}
            className="flex items-center gap-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-sm font-medium px-3 py-1.5 rounded-lg transition"
          >
            <Plus size={14} /> Nộp chi phí
          </button>
        </div>

        {showExpenseForm && (
          <form onSubmit={handleSubmitExpense} className="bg-emerald-50 rounded-xl p-4 space-y-3 border border-emerald-100 mb-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-emerald-700">Nộp chi phí mới</p>
              <button type="button" onClick={() => setShowExpenseForm(false)} className="text-gray-400"><X size={15} /></button>
            </div>

            <div>
              <label className="text-xs text-gray-600 font-medium">Sự kiện</label>
              <select required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                value={formEventId} onChange={e => setFormEventId(Number(e.target.value))}>
                <option value="">Chọn sự kiện</option>
                {myEvents.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600 font-medium">Loại chi phí</label>
                <select className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                  value={formCategory} onChange={e => setFormCategory(e.target.value as ExpenseCategory)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Số tiền (€)</label>
                <input type="number" min="0" step="0.01" required
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={formAmount} onChange={e => setFormAmount(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-600 font-medium">Ngày</label>
              <input type="date" required
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={formDate} onChange={e => setFormDate(e.target.value)} />
            </div>

            {/* Upload ảnh bill */}
            <div>
              <label className="text-xs text-gray-600 font-medium">Ảnh hóa đơn (không bắt buộc)</label>
              {expenseFile ? (
                <div className="mt-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <Image size={15} className="text-emerald-500 shrink-0" />
                  <span className="text-xs text-gray-700 truncate flex-1">{expenseFile.name}</span>
                  <button type="button" onClick={() => setExpenseFile(null)} className="text-gray-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="mt-1 flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-2.5 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition">
                  <Upload size={15} className="text-gray-400" />
                  <span className="text-xs text-gray-500">Chọn ảnh hoặc PDF</span>
                  <input type="file" accept="image/*,.pdf" className="hidden"
                    onChange={e => setExpenseFile(e.target.files?.[0] ?? null)} />
                </label>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={uploadingExp}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-60">
                {uploadingExp && <Loader size={14} className="animate-spin" />}
                {uploadingExp ? 'Đang gửi...' : 'Gửi'}
              </button>
              <button type="button" onClick={() => setShowExpenseForm(false)}
                className="flex-1 bg-white border border-gray-200 text-sm text-gray-600 py-2 rounded-lg">Huỷ</button>
            </div>
          </form>
        )}

        {allExpenses.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6 bg-white rounded-xl border border-dashed border-gray-200">
            Chưa có chi phí nào
          </p>
        ) : (
          <div className="space-y-2">
            {allExpenses.map(exp => (
              <div key={exp.id} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{exp.type}</p>
                    <p className="text-xs text-gray-500">{exp.eventName} · {exp.date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2">
                    <span className="text-sm font-bold text-gray-700">{exp.amount}€</span>
                    <ExpenseStatusBadge status={exp.status} />
                  </div>
                </div>
                {exp.imageUrl && (
                  <a href={exp.imageUrl} target="_blank" rel="noreferrer"
                    className="mt-2 flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700">
                    <Image size={12} /> Xem ảnh hóa đơn
                  </a>
                )}
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
