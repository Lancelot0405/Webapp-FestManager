import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Plus, Upload, Image, X, Pencil, Check, CreditCard, ShieldCheck, KeyRound, Copy, CheckCheck, Building2 } from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useStaffQuery } from '../../hooks/queries/useStaffQuery';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import { useUpdateStaff } from '../../hooks/queries/mutations/useUpdateStaff';
import { useAddContract } from '../../hooks/queries/mutations/useAddContract';
import { useAddExpense } from '../../hooks/queries/mutations/useAddExpense';
import { Input } from '@/components/shared/GlassInput';
import AppDatePicker from '@/components/shared/AppDatePicker';
import { Select } from '@/components/shared/GlassSelect';
import { ExpenseStatusBadge } from '../shared/StatusBadge';
import DocThumbnail from '../shared/DocThumbnail';
import { supabase } from '../../lib/supabase';
import { adminApi } from '../../lib/adminApi';
import { getErrorMessage } from '../../lib/errors';
import type { ExpenseCategory, Expense, StaffDocument, UserRole, UserDepartment } from '../../types';

const CATEGORIES: ExpenseCategory[] = ['Vé tàu/xe', 'Uber/Taxi', 'Ăn uống', 'Khác'];
const MAX_FILE_MB = 5;

export default function StaffProfile() {
  const { staffId: paramStaffId } = useParams<{ staffId?: string }>();
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const showToast = useToast();
  const { data: staff = [] } = useStaffQuery();
  const { data: events = [] } = useEventsQuery();
  const updateStaffMutation = useUpdateStaff();
  const addContractMutation = useAddContract();
  const addExpenseMutation = useAddExpense();

  // Khi ở /hr/:staffId → dùng params; khi ở /profile → tìm staff của chính mình
  const staffId = paramStaffId ?? (() => {
    const mine = staff.find(s => s.userId === currentUser?.id)
              ?? staff.find(s => s.name.toLowerCase() === currentUser?.name.toLowerCase());
    return mine ? String(mine.id) : '';
  })();

  const member = staff.find(s => String(s.id) === staffId);
  const isOwnProfile = currentUser && member?.userId === currentUser.id;
  const isAdmin      = currentUser?.role === 'admin';
  const isManager    = currentUser?.role === 'manager';
  const canEdit      = isOwnProfile || isAdmin;
  void isManager;

  const [editing,           setEditing]           = useState(false);
  const [editName,          setEditName]          = useState('');
  const [editDob,           setEditDob]           = useState('');
  const [editCity,          setEditCity]          = useState('');
  const [editStaffType,     setEditStaffType]     = useState<'permanent' | 'part-time'>('permanent');
  const [editRole,          setEditRole]          = useState<UserRole>('staff');
  const [editDepartment,    setEditDepartment]    = useState<UserDepartment>('restaurant');
  const [editUsername,      setEditUsername]      = useState('');
  const [editPhone,         setEditPhone]         = useState('');
  const [editCarteNum,      setEditCarteNum]      = useState('');
  const [editTitreNum,      setEditTitreNum]      = useState('');
  const [copiedField,       setCopiedField]       = useState<string | null>(null);

  const [showPwForm,  setShowPwForm]  = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwLoading,   setPwLoading]   = useState(false);
  const [pwMsg,       setPwMsg]       = useState('');

  const [currentUsername,   setCurrentUsername]   = useState<string | null>(null);
  const [memberCurrentRole, setMemberCurrentRole] = useState<UserRole | null>(null);
  const [memberDepartment,  setMemberDepartment]  = useState<UserDepartment | null>(null);
  useEffect(() => {
    if (!isAdmin || !member?.userId) return;
    adminApi.getUserEmail({ userId: member.userId }).then(({ data }) => {
      const email = data?.email ?? '';
      setCurrentUsername(email.replace('@festmanager.com', '').replace('@fm.com', '') || null);
    });
    supabase.from('users').select('role, department').eq('id', member.userId).single().then(({ data }) => {
      if (data?.role) setMemberCurrentRole(data.role as UserRole);
      if (data?.department) setMemberDepartment(data.department as UserDepartment);
    });
  }, [isAdmin, member?.userId]);

  const [uploadingContract,  setUploadingContract]  = useState(false);
  const [uploadingCarte,     setUploadingCarte]     = useState(false);
  const [uploadingTitre,     setUploadingTitre]     = useState(false);
  const contractFileRef = useRef<HTMLInputElement>(null);
  const carteFileRef    = useRef<HTMLInputElement>(null);
  const titreFileRef    = useRef<HTMLInputElement>(null);

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [formEventId,  setFormEventId]  = useState<number | ''>('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('Vé tàu/xe');
  const [formAmount,   setFormAmount]   = useState('');
  const [formDate,     setFormDate]     = useState('');
  const [expenseFile,  setExpenseFile]  = useState<File | null>(null);
  const [uploadingExp, setUploadingExp] = useState(false);

  if (!member) return (
    <div className="text-center py-20 text-muted">
      <p>Không tìm thấy nhân viên</p>
      {paramStaffId && (
        <Button variant="ghost" size="sm" className="mt-4 text-sm" onPress={() => navigate(-1)}>
          Quay lại
        </Button>
      )}
    </div>
  );

  const allExpenses: (Expense & { eventName: string })[] = events.flatMap(e =>
    e.receipts.filter(r => r.staffId === staffId).map(r => ({ ...r, eventName: e.name }))
  );
  const myEvents = events.filter(e => e.staff.some(s => String(s.id) === staffId));

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
    setEditRole(memberCurrentRole ?? 'staff');
    setEditDepartment(memberDepartment ?? 'restaurant');
    setEditUsername('');
    setEditCarteNum(member.carteVitaleNumber ?? '');
    setEditPhone(member.phone ?? '');
    setEditTitreNum(member.titreSejeurNumber ?? '');
    setEditing(true);
  };

  const saveEdit = async () => {
    updateStaffMutation.mutate({
      ...member,
      name: editName.trim(),
      dob: editDob.trim(),
      city: editCity.trim(),
      phone: editPhone.trim() || undefined,
      staffType: editStaffType,
      carteVitaleNumber: editCarteNum.trim() || undefined,
      titreSejeurNumber: editTitreNum.trim() || undefined,
    });
    if (isAdmin && member.userId) {
      const updates: { name?: string; role?: string; status?: string; department?: string | null } = {};
      if (editUsername.trim()) updates.name = editUsername.trim();
      if (editRole !== memberCurrentRole) {
        updates.role   = editRole;
        updates.status = 'active';
      }
      if (editRole !== 'admin' && editDepartment !== memberDepartment) {
        updates.department = editDepartment;
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from('users').update(updates).eq('id', member.userId);
        if (editRole !== memberCurrentRole) setMemberCurrentRole(editRole);
        if (editRole !== 'admin' && editDepartment !== memberDepartment) setMemberDepartment(editDepartment);
        if (editUsername.trim()) setCurrentUsername(editUsername.trim());
      }
    }
    setEditing(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member.userId || !newPassword.trim()) return;
    setPwLoading(true);
    setPwMsg('');
    try {
      const { error } = await adminApi.setPassword({ userId: member.userId, password: newPassword.trim() });
      if (error) throw new Error(error);
      setPwMsg('Đổi mật khẩu thành công!');
      setNewPassword('');
      setShowPwForm(false);
    } catch (err) {
      setPwMsg(`Lỗi: ${getErrorMessage(err, 'Không thể đổi mật khẩu.')}`);
    } finally {
      setPwLoading(false);
    }
  };

  const handleContractUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingContract(true);
    try {
      const url = await uploadFile(file, 'contracts', `staff-${member.id}`);
      addContractMutation.mutate({ staffId: member.id, contract: { id: Date.now(), date: nowStr(), url, fileName: file.name } });
    } catch (err) { showToast(getErrorMessage(err, 'Upload thất bại.'), 'error'); }
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
      updateStaffMutation.mutate({ ...member, [docType]: doc });
    } catch (err) { showToast(getErrorMessage(err, 'Upload thất bại.'), 'error'); }
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
      addExpenseMutation.mutate({ eventId: formEventId as number, expense: {
        id: Date.now(), staffId: String(member.id), staffName: member.name,
        festivalId: formEventId as number, type: formCategory,
        amount: parseFloat(formAmount), date: `${dd}-${mm}-${yyyy}`, imageUrl, status: 'pending',
      }});
      setShowExpenseForm(false);
      setFormAmount(''); setFormDate(''); setFormEventId(''); setExpenseFile(null);
    } catch (err) { showToast(getErrorMessage(err, 'Upload thất bại.'), 'error'); }
    finally { setUploadingExp(false); }
  };

  return (
    <div className="space-y-5 pb-20">
      {paramStaffId && (
        <div className="flex items-center gap-2">
          <Button isIconOnly variant="ghost" size="sm" className="text-muted hover:text-foreground" onPress={() => navigate(-1)}>
            <ArrowLeft size={22} />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Hồ sơ nhân viên</h1>
        </div>
      )}

      <div className="space-y-5 md:grid md:grid-cols-2 md:gap-5 md:space-y-0 md:items-start">
      {/* ── CỘT TRÁI: Thông tin + Tài khoản ──────────────────────────── */}
      <div className="space-y-5">
      {/* ── THÔNG TIN CÁ NHÂN ──────────────────────────────────────────── */}
      <div className="bg-surface border border-separator rounded-xl shadow-sm p-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-semibold text-foreground">Thông tin cá nhân</p>
          {canEdit && !editing && (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-muted hover:text-foreground flex items-center gap-1 px-2.5 py-1.5 rounded-lg h-auto min-w-0 bg-default/50 border border-separator"
              onPress={startEdit}
            >
              <Pencil size={12} /> Chỉnh sửa
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <Input label="Họ tên" value={editName} onChange={setEditName} />
            <Input
              label="Ngày sinh (DD-MM-YYYY)"
              placeholder="01-01-2000"
              value={editDob}
              onChange={setEditDob}
            />
            <Input label="Nơi ở" value={editCity} onChange={setEditCity} placeholder="Paris, Lyon..." />
            <Input label="Số điện thoại" type="tel" value={editPhone} onChange={setEditPhone} placeholder="+33 6 XX XX XX XX" />
            <Input label="Số Carte Vitale" value={editCarteNum} onChange={setEditCarteNum} placeholder="1 85 01 75 XXX XXX XX" inputClassName="font-mono" />
            <Input label="Số Titre de Séjour" value={editTitreNum} onChange={setEditTitreNum} placeholder="XXXXXXXXX" inputClassName="font-mono" />
            {isAdmin && (
              <>
                <div>
                  <label className="text-xs text-muted font-medium mb-1 block">Loại nhân viên</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="ghost" onPress={() => setEditStaffType('permanent')}
                      className={`w-full h-auto min-w-0 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        editStaffType === 'permanent'
                          ? 'bg-accent/10 text-accent border-accent/30'
                          : 'bg-default/50 text-foreground/80 border-separator hover:border-accent/30'
                      }`}>
                      Nhân viên cứng
                    </Button>
                    <Button variant="ghost" onPress={() => setEditStaffType('part-time')}
                      className={`w-full h-auto min-w-0 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        editStaffType === 'part-time'
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                          : 'bg-default/50 text-foreground/80 border-separator hover:border-indigo-500/30'
                      }`}>
                      Part-time
                    </Button>
                  </div>
                </div>
                {member.userId && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted font-medium flex items-center gap-1 mb-1">
                        <ShieldCheck size={12} /> Quyền tài khoản
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="ghost" onPress={() => setEditRole('staff')}
                          className={`w-full h-auto min-w-0 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            editRole === 'staff'
                              ? 'bg-accent/10 text-accent border-accent/30'
                              : 'bg-default/50 text-foreground/80 border-separator hover:border-accent/30'
                          }`}>
                          Nhân viên
                        </Button>
                        <Button variant="ghost" onPress={() => setEditRole('manager')}
                          className={`w-full h-auto min-w-0 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            editRole === 'manager'
                              ? 'bg-warning/10 text-warning border-warning/30'
                              : 'bg-default/50 text-foreground/80 border-separator hover:border-warning/30'
                          }`}>
                          Quản lý
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted font-medium flex items-center gap-1 mb-1">
                        <Building2 size={12} /> Bộ phận kho hàng
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { id: 'restaurant' as UserDepartment, label: 'Nhà hàng' },
                          { id: 'festival'   as UserDepartment, label: 'Festival' },
                          { id: 'both'       as UserDepartment, label: 'Cả hai'  },
                        ]).map(({ id, label }) => (
                          <Button key={id} variant="ghost" onPress={() => setEditDepartment(id)}
                            className={`w-full h-auto min-w-0 py-2 rounded-lg text-xs font-medium border transition-colors ${
                              editDepartment === id
                                ? 'bg-success/10 text-success border-success/30'
                                : 'bg-default/50 text-foreground/80 border-separator hover:border-success/30'
                            }`}>
                            {label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1 bg-accent text-white dark:text-foreground text-sm font-medium rounded-xl flex items-center justify-center gap-1.5"
                size="sm"
                onPress={saveEdit}
              >
                <Check size={14} /> Lưu
              </Button>
              <Button
                variant="ghost"
                className="flex-1 border border-separator text-sm text-foreground/80 rounded-xl"
                size="sm"
                onPress={() => setEditing(false)}
              >
                Huỷ
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Row label="Họ tên"     value={member.name} />
            <Row label="Ngày sinh"  value={member.dob || '—'} />
            <Row label="Nơi ở"      value={member.city || '—'} />
            <Row label="Điện thoại" value={member.phone || '—'} />
            <Row label="Sự kiện"    value={`${myEvents.length} sự kiện`} />
            {isAdmin && (
              <>
                <Row label="Loại" value={member.staffType === 'part-time' ? 'Part-time' : 'Nhân viên cứng'} />
                {memberCurrentRole && (
                  <Row label="Quyền" value={memberCurrentRole === 'manager' ? 'Quản lý' : 'Nhân viên'} />
                )}
                {memberDepartment && (
                  <Row label="Bộ phận" value={memberDepartment === 'restaurant' ? 'Nhà hàng' : memberDepartment === 'festival' ? 'Festival' : 'Cả hai'} />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── QUẢN LÝ TÀI KHOẢN (chỉ admin) ─────────────────────────────── */}
      {isAdmin && member.userId && (
        <div className="bg-surface border border-separator rounded-xl shadow-sm p-4 space-y-4">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <KeyRound size={15} className="text-warning" /> Quản lý tài khoản
          </p>

          {/* Username */}
          <div>
            <label className="text-xs text-muted font-medium block mb-1">Tên đăng nhập</label>
            {currentUsername && (
              <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-default/50 rounded-lg border border-separator">
                <span className="text-xs text-muted shrink-0">Hiện tại:</span>
                <span className="text-sm font-mono font-medium text-foreground/80 flex-1 truncate">
                  {currentUsername}<span className="text-muted">@fm.com</span>
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                className="flex-1"
                placeholder="username mới"
                value={editUsername}
                onChange={(v) => setEditUsername(v.replace(/\s/g, '').toLowerCase())}
                endContent={<span className="font-mono text-xs">@fm.com</span>}
              />
              <Button
                size="sm"
                className="bg-accent text-white dark:text-foreground text-sm font-medium px-3 rounded-lg flex items-center gap-1"
                onPress={async () => {
                  if (!editUsername.trim()) return;
                  await supabase.from('users').update({ name: editUsername.trim() }).eq('id', member.userId!);
                  setCurrentUsername(editUsername.trim());
                  setEditUsername('');
                  setPwMsg('Đã cập nhật tên tài khoản!');
                  setTimeout(() => setPwMsg(''), 3000);
                }}
              >
                <Check size={13} /> Lưu
              </Button>
            </div>
          </div>

          {/* Mật khẩu */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-muted font-medium">Mật khẩu</label>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-warning bg-warning/10 border border-warning/20 px-2.5 py-1 rounded-lg h-auto min-w-0 hover:bg-warning/20 transition-colors"
                onPress={() => { setShowPwForm(!showPwForm); setPwMsg(''); setNewPassword(''); }}
              >
                {showPwForm ? 'Huỷ' : 'Đổi mật khẩu'}
              </Button>
            </div>
            {showPwForm && (
              <form onSubmit={handleChangePassword} className="flex gap-2">
                <Input
                  isRequired
                  type="password"
                  minLength={6}
                  placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                  className="flex-1"
                  value={newPassword}
                  onChange={setNewPassword}
                />
                <Button
                  type="submit"
                  isDisabled={pwLoading}
                  size="sm"
                  className="bg-warning text-white dark:text-foreground text-sm font-medium px-3 rounded-lg flex items-center gap-1"
                >
                  {pwLoading ? <Spinner size="sm" color="current" /> : <Check size={13} />}
                  Lưu
                </Button>
              </form>
            )}
          </div>

          {pwMsg && (
            <p className={`text-xs ${pwMsg.startsWith('Lỗi') ? 'text-danger' : 'text-success'}`}>{pwMsg}</p>
          )}
        </div>
      )}
      </div>
      {/* ── CỘT PHẢI: Tài liệu + Hợp đồng + Chi phí ──────────────────── */}
      <div className="space-y-5">

      {/* ── TÀI LIỆU CÁ NHÂN ───────────────────────────────────────────── */}
      {canEdit && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Tài liệu cá nhân</p>

          <DocCard
            icon={<CreditCard size={18} className="text-success" />}
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

          <DocCard
            icon={<ShieldCheck size={18} className="text-indigo-400" />}
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
          <h2 className="text-sm font-semibold text-foreground">Hợp đồng ({member.contracts.length})</h2>
          {canEdit && (
            <label className={`flex items-center gap-1 text-sm font-medium cursor-pointer px-3 py-1.5 rounded-lg border border-separator transition-colors ${
              uploadingContract
                ? 'bg-default/50 text-muted'
                : 'bg-default/50 text-foreground/80 hover:border-accent/30 hover:text-foreground'
            }`}>
              {uploadingContract ? <Spinner size="sm" color="current" /> : <Upload size={14} />}
              {uploadingContract ? 'Đang upload...' : 'Upload hợp đồng'}
              <input ref={contractFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden" disabled={uploadingContract} onChange={handleContractUpload} />
            </label>
          )}
        </div>
        {member.contracts.length === 0 ? (
          <p className="text-xs text-muted py-4 text-center bg-surface border border-separator rounded-xl border-dashed">
            Chưa có hợp đồng
          </p>
        ) : (
          <div className="space-y-2">
            {member.contracts.map(c => (
              <a key={c.id} href={c.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 bg-surface border border-separator rounded-xl shadow-sm p-3 hover:border-accent/30 transition-colors">
                <FileText size={18} className="text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{c.fileName ?? 'Hợp đồng'}</p>
                  <p className="text-xs text-muted">{c.date}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ── CHI PHÍ ─────────────────────────────────────────────────────── */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-semibold text-foreground">Chi phí ({allExpenses.length})</h2>
          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              className="bg-success/10 text-success border border-success/20 text-sm font-medium px-3 py-1.5 rounded-lg h-auto hover:bg-success/20 flex items-center gap-1 transition-colors"
              onPress={() => setShowExpenseForm(!showExpenseForm)}
            >
              <Plus size={14} /> Nộp chi phí
            </Button>
          )}
        </div>

        {showExpenseForm && (
          <form onSubmit={handleSubmitExpense} className="bg-surface border border-separator rounded-xl shadow-sm p-4 space-y-3 mb-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-success">Nộp chi phí mới</p>
              <Button isIconOnly variant="ghost" size="sm" className="text-muted h-auto min-w-0 p-0 hover:text-danger" onPress={() => setShowExpenseForm(false)}>
                <X size={15} />
              </Button>
            </div>
            <Select
              label="Sự kiện"
              required
              placeholder="Chọn sự kiện"
              value={formEventId ? String(formEventId) : ''}
              onChange={(v) => setFormEventId(Number(v))}
              options={myEvents.map(ev => ({ value: String(ev.id), label: ev.name }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <Select
                label="Loại chi phí"
                value={formCategory}
                onChange={(v) => setFormCategory(v as ExpenseCategory)}
                options={CATEGORIES.map(c => ({ value: c, label: c }))}
              />
              <Input
                label="Số tiền (€)"
                type="number"
                min={0}
                step={0.01}
                isRequired
                value={formAmount}
                onChange={setFormAmount}
              />
            </div>
            <AppDatePicker
              label="Ngày"
              isRequired
              value={formDate}
              onChange={setFormDate}
            />
            <div>
              <label className="text-xs text-foreground/80 font-medium block mb-1">Ảnh hóa đơn (không bắt buộc, tối đa 5MB)</label>
              {expenseFile ? (
                <div className="flex items-center gap-2 bg-surface border border-separator rounded-xl rounded-lg px-3 py-2">
                  <Image size={15} className="text-success shrink-0" />
                  <span className="text-xs text-foreground truncate flex-1">{expenseFile.name}</span>
                  <Button isIconOnly variant="ghost" size="sm" className="h-auto min-w-0 p-0 text-muted hover:text-danger" onPress={() => setExpenseFile(null)}>
                    <X size={14} />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center gap-2 border border-dashed border-separator rounded-lg px-3 py-2.5 cursor-pointer hover:border-accent/30 hover:bg-default/50 transition-colors">
                  <Upload size={15} className="text-muted" />
                  <span className="text-xs text-muted">Chọn ảnh hoặc PDF</span>
                  <input type="file" accept="image/*,.pdf" className="hidden"
                    onChange={e => setExpenseFile(e.target.files?.[0] ?? null)} />
                </label>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                isDisabled={uploadingExp}
                className="flex-1 bg-success text-white dark:text-foreground text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-1.5"
                size="sm"
              >
                {uploadingExp && <Spinner size="sm" color="current" />}
                {uploadingExp ? 'Đang gửi...' : 'Gửi'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="flex-1 border border-separator text-sm text-foreground/80 rounded-lg"
                size="sm"
                onPress={() => setShowExpenseForm(false)}
              >
                Huỷ
              </Button>
            </div>
          </form>
        )}

        {allExpenses.length === 0 ? (
          <p className="text-xs text-muted text-center py-6 bg-surface border border-separator rounded-xl border-dashed">Chưa có chi phí nào</p>
        ) : (
          <div className="space-y-2">
            {allExpenses.map(exp => (
              <div key={exp.id} className="bg-surface border border-separator rounded-xl shadow-sm p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{exp.type}</p>
                    <p className="text-xs text-muted">{exp.eventName} · {exp.date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2">
                    <span className="text-sm font-bold text-foreground">{exp.amount}€</span>
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
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
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
    <div className="bg-surface border border-separator rounded-xl shadow-sm p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-sm font-medium text-foreground">{label}</p>
        </div>
        <label className={`flex items-center gap-1 text-xs font-medium cursor-pointer px-2.5 py-1.5 rounded-lg border border-separator transition-colors ${
          uploading
            ? 'bg-default/50 text-muted'
            : 'bg-default/50 text-foreground/80 hover:text-foreground hover:border-accent/30'
        }`}>
          {uploading ? <Spinner size="sm" color="current" /> : <Upload size={12} />}
          {uploading ? 'Uploading...' : doc ? 'Cập nhật' : 'Upload'}
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
            disabled={uploading} onChange={onUpload} />
        </label>
      </div>

      {cardNumber ? (
        <div className="flex items-center justify-between bg-default/50 rounded-lg px-3 py-2 border border-separator">
          <span className="text-sm font-mono text-foreground tracking-wide">{cardNumber}</span>
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            className="ml-2 h-auto min-w-0 p-1 text-muted hover:text-foreground"
            aria-label="Sao chép"
            onPress={() => onCopy(cardNumber)}
          >
            {copied ? <CheckCheck size={14} className="text-success" /> : <Copy size={14} />}
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted italic">Chưa có số thẻ — chỉnh sửa thông tin để thêm</p>
      )}

      {doc ? (
        <div className="space-y-1.5">
          <DocThumbnail url={doc.url} fileName={doc.fileName} />
          <p className="text-xs text-muted">Cập nhật: {doc.uploadedAt}</p>
        </div>
      ) : (
        <p className="text-xs text-muted">Chưa có tài liệu</p>
      )}
    </div>
  );
}
