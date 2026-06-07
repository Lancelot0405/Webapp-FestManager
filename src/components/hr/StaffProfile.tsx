import { useState, useRef } from 'react';
import { ArrowLeft, FileText, Plus, Upload, Image, X, Loader, Pencil, Check, CreditCard, ShieldCheck, KeyRound, Copy, CheckCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExpenseStatusBadge } from '../shared/StatusBadge';
import DocThumbnail from '../shared/DocThumbnail';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import type { ExpenseCategory, Expense, StaffDocument } from '../../types';

interface StaffProfileProps {
  staffId: string;
  onBack?: () => void;
}

const CATEGORIES: ExpenseCategory[] = ['Vé tàu/xe', 'Uber/Taxi', 'Ăn uống', 'Khác'];
const MAX_FILE_MB = 5;

export default function StaffProfile({ staffId, onBack }: StaffProfileProps) {
  const { state, addExpense, addContract, updateStaff } = useApp();
  const { staff, events, currentUser } = state;

  const member = staff.find(s => String(s.id) === staffId);
  const isOwnProfile = currentUser && member?.userId === currentUser.id;
  const isAdmin      = currentUser?.role === 'admin';
  const canEdit      = isOwnProfile || isAdmin;

  // ── Edit thông tin cá nhân ──────────────────────────────────────────────
  const [editing,           setEditing]           = useState(false);
  const [editName,          setEditName]          = useState('');
  const [editDob,           setEditDob]           = useState('');
  const [editCity,          setEditCity]          = useState('');
  const [editStaffType,     setEditStaffType]     = useState<'permanent' | 'part-time'>('permanent');
  const [editUsername,      setEditUsername]      = useState('');
  const [editPhone,         setEditPhone]         = useState('');
  const [editCarteNum,      setEditCarteNum]      = useState('');
  const [editTitreNum,      setEditTitreNum]      = useState('');
  const [copiedField,       setCopiedField]       = useState<string | null>(null);

  // ── Đổi mật khẩu (admin only) ───────────────────────────────────────────
  const [showPwForm,  setShowPwForm]  = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwLoading,   setPwLoading]   = useState(false);
  const [pwMsg,       setPwMsg]       = useState('');

  // ── Upload tài liệu ─────────────────────────────────────────────────────
  const [uploadingContract,  setUploadingContract]  = useState(false);
  const [uploadingCarte,     setUploadingCarte]     = useState(false);
  const [uploadingTitre,     setUploadingTitre]     = useState(false);
  const contractFileRef = useRef<HTMLInputElement>(null);
  const carteFileRef    = useRef<HTMLInputElement>(null);
  const titreFileRef    = useRef<HTMLInputElement>(null);

  // ── Form chi phí ────────────────────────────────────────────────────────
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [formEventId,  setFormEventId]  = useState<number | ''>('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('Vé tàu/xe');
  const [formAmount,   setFormAmount]   = useState('');
  const [formDate,     setFormDate]     = useState('');
  const [expenseFile,  setExpenseFile]  = useState<File | null>(null);
  const [uploadingExp, setUploadingExp] = useState(false);

  if (!member) return (
    <div className="text-center py-20 text-gray-400">
      <p>Không tìm thấy nhân viên</p>
      {onBack && <button onClick={onBack} className="mt-4 text-blue-600 text-sm">Quay lại</button>}
    </div>
  );

  const allExpenses: (Expense & { eventName: string })[] = events.flatMap(e =>
    e.receipts.filter(r => r.staffId === staffId).map(r => ({ ...r, eventName: e.name }))
  );
  const myEvents = events.filter(e => e.staff.some(s => String(s.id) === staffId));

  // ── Helpers ─────────────────────────────────────────────────────────────
  const uploadFile = async (file: File, bucket: string, folder: string): Promise<string> => {
    if (file.size > MAX_FILE_MB * 1024 * 1024)
      throw new Error(`File quá lớn. Vui lòng chọn file dưới ${MAX_FILE_MB}MB.`);
    const ext  = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  };

  const nowStr = () => new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');

  // ── Handlers ────────────────────────────────────────────────────────────
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const startEdit = () => {
    setEditName(member.name);
    setEditDob(member.dob);
    setEditCity(member.city);
    setEditStaffType(member.staffType ?? 'permanent');
    setEditUsername('');
    setEditCarteNum(member.carteVitaleNumber ?? '');
    setEditPhone(member.phone ?? '');
    setEditTitreNum(member.titreSejeurNumber ?? '');
    setEditing(true);
  };

  const saveEdit = async () => {
    updateStaff({
      ...member,
      name: editName.trim(),
      dob: editDob.trim(),
      city: editCity.trim(),
      phone: editPhone.trim() || undefined,
      staffType: editStaffType,
      carteVitaleNumber: editCarteNum.trim() || undefined,
      titreSejeurNumber: editTitreNum.trim() || undefined,
    });
    if (isAdmin && member.userId && editUsername.trim()) {
      await supabase.from('users').update({ name: editUsername.trim() }).eq('id', member.userId);
    }
    setEditing(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member.userId || !newPassword.trim()) return;
    setPwLoading(true);
    setPwMsg('');
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(member.userId, {
        password: newPassword.trim(),
      });
      if (error) throw error;
      setPwMsg('Đổi mật khẩu thành công!');
      setNewPassword('');
      setShowPwForm(false);
    } catch (err: any) {
      setPwMsg(`Lỗi: ${err?.message ?? 'Không thể đổi mật khẩu.'}`);
    } finally {
      setPwLoading(false);
    }
  };

  const handleContractUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingContract(true);
    try {
      const url = await uploadFile(file, 'contracts', `staff-${member.id}`);
      addContract(member.id, { id: Date.now(), date: nowStr(), url, fileName: file.name });
    } catch (err: any) { alert(err?.message ?? 'Upload thất bại.'); }
    finally { setUploadingContract(false); if (contractFileRef.current) contractFileRef.current.value = ''; }
  };

  const handleDocUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: 'carteVitale' | 'titreSejour',
    setUploading: (v: boolean) => void,
    ref: React.RefObject<HTMLInputElement | null>
  ) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, 'documents', `staff-${member.id}/${docType}`);
      const doc: StaffDocument = { url, fileName: file.name, uploadedAt: nowStr() };
      updateStaff({ ...member, [docType]: doc });
    } catch (err: any) { alert(err?.message ?? 'Upload thất bại.'); }
    finally { setUploading(false); if (ref.current) ref.current.value = ''; }
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEventId || !formAmount || !formDate || !currentUser) return;
    setUploadingExp(true);
    try {
      let imageUrl = '';
      if (expenseFile) imageUrl = await uploadFile(expenseFile, 'expenses', `staff-${member.id}`);
      const [yyyy, mm, dd] = formDate.split('-');
      addExpense(formEventId as number, {
        id: Date.now(), staffId: String(member.id), staffName: member.name,
        festivalId: formEventId as number, type: formCategory,
        amount: parseFloat(formAmount), date: `${dd}-${mm}-${yyyy}`, imageUrl, status: 'pending',
      });
      setShowExpenseForm(false);
      setFormAmount(''); setFormDate(''); setFormEventId(''); setExpenseFile(null);
    } catch (err: any) { alert(err?.message ?? 'Upload thất bại.'); }
    finally { setUploadingExp(false); }
  };

  return (
    <div className="space-y-5 pb-20">
      {onBack && (
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1 text-gray-500 hover:text-gray-700"><ArrowLeft size={22} /></button>
          <h1 className="text-lg font-bold text-gray-800">Hồ sơ nhân viên</h1>
        </div>
      )}

      {/* ── THÔNG TIN CÁ NHÂN ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-semibold text-gray-700">Thông tin cá nhân</p>
          {canEdit && !editing && (
            <button onClick={startEdit}
              className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100">
              <Pencil size={12} /> Chỉnh sửa
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">Họ tên</label>
              <input className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Ngày sinh (DD-MM-YYYY)</label>
              <input className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="01-01-2000" value={editDob} onChange={e => setEditDob(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Nơi ở</label>
              <input className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Paris, Lyon..." value={editCity} onChange={e => setEditCity(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Số điện thoại</label>
              <input className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                type="tel" placeholder="+33 6 XX XX XX XX"
                value={editPhone} onChange={e => setEditPhone(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Số Carte Vitale</label>
              <input className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
                placeholder="1 85 01 75 XXX XXX XX"
                value={editCarteNum} onChange={e => setEditCarteNum(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Số Titre de Séjour</label>
              <input className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
                placeholder="XXXXXXXXX"
                value={editTitreNum} onChange={e => setEditTitreNum(e.target.value)} />
            </div>
            {isAdmin && (
              <div>
                <label className="text-xs text-gray-500 font-medium">Loại nhân viên</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setEditStaffType('permanent')}
                    className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                      editStaffType === 'permanent'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                    }`}>
                    Nhân viên cứng
                  </button>
                  <button type="button" onClick={() => setEditStaffType('part-time')}
                    className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                      editStaffType === 'part-time'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                    }`}>
                    Part-time
                  </button>
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={saveEdit}
                className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white text-sm font-medium py-2 rounded-lg">
                <Check size={14} /> Lưu
              </button>
              <button onClick={() => setEditing(false)}
                className="flex-1 bg-white border border-gray-200 text-sm text-gray-600 py-2 rounded-lg">
                Huỷ
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Row label="Họ tên"        value={member.name} />
            <Row label="Ngày sinh"     value={member.dob || '—'} />
            <Row label="Nơi ở"         value={member.city || '—'} />
            <Row label="Điện thoại"    value={member.phone || '—'} />
            <Row label="Sự kiện"       value={`${myEvents.length} sự kiện`} />
            {isAdmin && (
              <Row
                label="Loại"
                value={member.staffType === 'part-time' ? 'Part-time' : 'Nhân viên cứng'}
              />
            )}
          </div>
        )}
      </div>

      {/* ── QUẢN LÝ TÀI KHOẢN (chỉ admin) ─────────────────────────────── */}
      {isAdmin && member.userId && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <KeyRound size={15} className="text-orange-500" /> Quản lý tài khoản
          </p>

          {/* Đổi tên tài khoản */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Tên đăng nhập</label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <input
                  className="flex-1 px-3 py-2 text-sm"
                  placeholder="username mới"
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                />
                <span className="px-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200 py-2 shrink-0">@festmanager.com</span>
              </div>
              <button
                onClick={async () => {
                  if (!editUsername.trim()) return;
                  await supabase.from('users').update({ name: editUsername.trim() }).eq('id', member.userId!);
                  setEditUsername('');
                  setPwMsg('Đã cập nhật tên tài khoản!');
                  setTimeout(() => setPwMsg(''), 3000);
                }}
                className="flex items-center gap-1 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg"
              >
                <Check size={13} /> Lưu
              </button>
            </div>
          </div>

          {/* Đổi mật khẩu */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-gray-500 font-medium">Mật khẩu</label>
              <button
                onClick={() => { setShowPwForm(!showPwForm); setPwMsg(''); setNewPassword(''); }}
                className="text-xs text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg"
              >
                {showPwForm ? 'Huỷ' : 'Đổi mật khẩu'}
              </button>
            </div>
            {showPwForm && (
              <form onSubmit={handleChangePassword} className="flex gap-2">
                <input
                  required type="password" minLength={6}
                  placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <button
                  type="submit" disabled={pwLoading}
                  className="flex items-center gap-1 bg-orange-500 text-white text-sm font-medium px-3 py-2 rounded-lg disabled:opacity-60"
                >
                  {pwLoading ? <Loader size={13} className="animate-spin" /> : <Check size={13} />}
                  Lưu
                </button>
              </form>
            )}
          </div>

          {pwMsg && (
            <p className={`text-xs ${pwMsg.startsWith('Lỗi') ? 'text-red-500' : 'text-green-600'}`}>{pwMsg}</p>
          )}
        </div>
      )}

      {/* ── TÀI LIỆU CÁ NHÂN ───────────────────────────────────────────── */}
      {canEdit && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Tài liệu cá nhân</p>

          {/* Carte Vitale */}
          <DocCard
            icon={<CreditCard size={18} className="text-emerald-500" />}
            label="Carte Vitale"
            cardNumber={member.carteVitaleNumber}
            doc={member.carteVitale}
            uploading={uploadingCarte}
            fileRef={carteFileRef}
            onUpload={e => handleDocUpload(e, 'carteVitale', setUploadingCarte, carteFileRef)}
            copiedField={copiedField}
            onCopy={num => copyToClipboard(num, 'carte')}
            copyKey="carte"
          />

          {/* Titre de Séjour */}
          <DocCard
            icon={<ShieldCheck size={18} className="text-purple-500" />}
            label="Titre de Séjour"
            cardNumber={member.titreSejeurNumber}
            doc={member.titreSejour}
            uploading={uploadingTitre}
            fileRef={titreFileRef}
            onUpload={e => handleDocUpload(e, 'titreSejour', setUploadingTitre, titreFileRef)}
            copiedField={copiedField}
            onCopy={num => copyToClipboard(num, 'titre')}
            copyKey="titre"
          />
        </div>
      )}

      {/* ── HỢP ĐỒNG ────────────────────────────────────────────────────── */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-semibold text-gray-700">Hợp đồng ({member.contracts.length})</h2>
          {canEdit && (
            <label className={`flex items-center gap-1 text-sm font-medium cursor-pointer px-3 py-1.5 rounded-lg transition
              ${uploadingContract ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
              {uploadingContract ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploadingContract ? 'Đang upload...' : 'Upload hợp đồng'}
              <input ref={contractFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden" disabled={uploadingContract} onChange={handleContractUpload} />
            </label>
          )}
        </div>
        {member.contracts.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center bg-white rounded-xl border border-dashed border-gray-200">
            Chưa có hợp đồng
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
          {canEdit && (
            <button onClick={() => setShowExpenseForm(!showExpenseForm)}
              className="flex items-center gap-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-sm font-medium px-3 py-1.5 rounded-lg transition">
              <Plus size={14} /> Nộp chi phí
            </button>
          )}
        </div>

        {showExpenseForm && (
          <form onSubmit={handleSubmitExpense} className="bg-emerald-50 rounded-xl p-4 space-y-3 border border-emerald-100 mb-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-emerald-700">Nộp chi phí mới</p>
              <button type="button" onClick={() => setShowExpenseForm(false)}><X size={15} className="text-gray-400" /></button>
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
              <input type="date" required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={formDate} onChange={e => setFormDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium">Ảnh hóa đơn (không bắt buộc, tối đa 5MB)</label>
              {expenseFile ? (
                <div className="mt-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <Image size={15} className="text-emerald-500 shrink-0" />
                  <span className="text-xs text-gray-700 truncate flex-1">{expenseFile.name}</span>
                  <button type="button" onClick={() => setExpenseFile(null)}><X size={14} className="text-gray-400 hover:text-red-500" /></button>
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
          <p className="text-xs text-gray-400 text-center py-6 bg-white rounded-xl border border-dashed border-gray-200">Chưa có chi phí nào</p>
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
                  <div className="mt-2">
                    <DocThumbnail url={exp.imageUrl} fileName="Hóa đơn" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}

function DocCard({
  icon, label, cardNumber, doc, uploading, fileRef, onUpload, copiedField, onCopy, copyKey,
}: {
  icon: React.ReactNode;
  label: string;
  cardNumber?: string;
  doc?: { url: string; fileName: string; uploadedAt: string };
  uploading: boolean;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  copiedField: string | null;
  onCopy: (num: string) => void;
  copyKey: string;
}) {
  const copied = copiedField === copyKey;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-sm font-medium text-gray-800">{label}</p>
        </div>
        <label className={`flex items-center gap-1 text-xs font-medium cursor-pointer px-2.5 py-1.5 rounded-lg transition
          ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
          {uploading ? <Loader size={12} className="animate-spin" /> : <Upload size={12} />}
          {uploading ? 'Uploading...' : doc ? 'Cập nhật' : 'Upload'}
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
            disabled={uploading} onChange={onUpload} />
        </label>
      </div>

      {/* Số thẻ */}
      {cardNumber ? (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
          <span className="text-sm font-mono text-gray-800 tracking-wide">{cardNumber}</span>
          <button
            onClick={() => onCopy(cardNumber)}
            className="ml-2 p-1 text-gray-400 hover:text-blue-600 transition-colors shrink-0"
            title="Sao chép"
          >
            {copied ? <CheckCheck size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">Chưa có số thẻ — chỉnh sửa thông tin để thêm</p>
      )}

      {/* File */}
      {doc ? (
        <div className="space-y-1.5">
          <DocThumbnail url={doc.url} fileName={doc.fileName} />
          <p className="text-xs text-gray-400">Cập nhật: {doc.uploadedAt}</p>
        </div>
      ) : (
        <p className="text-xs text-gray-400">Chưa có tài liệu</p>
      )}
    </div>
  );
}
