import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Plus, Upload, Image, X, Pencil, Check, CreditCard, ShieldCheck, KeyRound, Copy, CheckCheck, Building2, UserX, Loader2 } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useStaffQuery } from '../../hooks/queries/useStaffQuery';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import { useUpdateStaff } from '../../hooks/queries/mutations/useUpdateStaff';
import { useAddContract } from '../../hooks/queries/mutations/useAddContract';
import { useAddExpense } from '../../hooks/queries/mutations/useAddExpense';
import AppDatePicker from '@/components/shared/AppDatePicker';
import FranceCityAutocomplete from '@/components/shared/FranceCityAutocomplete';
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
    <EmptyState
      icon={<UserX size={26} />}
      title="Không tìm thấy nhân viên"
      action={paramStaffId ? { label: 'Quay lại', onClick: () => navigate(-1) } : undefined}
    />
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
          <Button
            type="button"
            variant="ghost"
            className="text-muted hover:text-foreground h-8 w-8 p-0 flex items-center justify-center rounded-full"
            onClick={() => navigate(-1)}
            aria-label="Quay lại"
          >
            <ArrowLeft size={22} />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Hồ sơ nhân viên</h1>
        </div>
      )}

      <div className="space-y-5 md:grid md:grid-cols-2 md:gap-5 md:space-y-0 md:items-start">
      {/* ── CỘT TRÁI: Thông tin + Tài khoản ──────────────────────────── */}
      <div className="space-y-5">
      {/* ── THÔNG TIN CÁ NHÂN ──────────────────────────────────────────── */}
      <Card className="p-4 border">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-semibold text-foreground">Thông tin cá nhân</p>
          {canEdit && !editing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-auto min-w-0"
              onClick={startEdit}
            >
              <Pencil size={12} /> Chỉnh sửa
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div className="w-full flex flex-col gap-1">
              <Label className="text-xs font-medium text-foreground/80">Họ tên</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="w-full flex flex-col gap-1">
              <Label className="text-xs font-medium text-foreground/80">Ngày sinh (DD-MM-YYYY)</Label>
              <Input placeholder="01-01-2000" value={editDob} onChange={(e) => setEditDob(e.target.value)} />
            </div>
            <FranceCityAutocomplete label="Thành phố" value={editCity} onChange={setEditCity} />
            <div className="w-full flex flex-col gap-1">
              <Label className="text-xs font-medium text-foreground/80">Số điện thoại</Label>
              <Input type="tel" placeholder="+33 6 XX XX XX XX" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div className="w-full flex flex-col gap-1">
              <Label className="text-xs font-medium text-foreground/80">Số Carte Vitale</Label>
              <Input placeholder="1 85 01 75 XXX XXX XX" className="font-mono" value={editCarteNum} onChange={(e) => setEditCarteNum(e.target.value)} />
            </div>
            <div className="w-full flex flex-col gap-1">
              <Label className="text-xs font-medium text-foreground/80">Số Titre de Séjour</Label>
              <Input placeholder="XXXXXXXXX" className="font-mono" value={editTitreNum} onChange={(e) => setEditTitreNum(e.target.value)} />
            </div>
            {isAdmin && (
              <>
                <div>
                  <Label className="text-xs text-muted font-medium mb-1 block">Loại nhân viên</Label>
                  <ToggleGroup
                    type="single"
                    value={editStaffType}
                    onValueChange={val => { if (val) setEditStaffType(val as 'permanent' | 'part-time'); }}
                    className="w-full bg-muted/40 p-1 rounded-xl border flex"
                  >
                    <ToggleGroupItem value="permanent" className="flex-1 text-sm h-9 font-semibold">Nhân viên cứng</ToggleGroupItem>
                    <ToggleGroupItem value="part-time" className="flex-1 text-sm h-9 font-semibold">Part-time</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                {member.userId && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted font-medium flex items-center gap-1 mb-1">
                        <ShieldCheck size={12} /> Quyền tài khoản
                      </Label>
                      <ToggleGroup
                        type="single"
                        value={editRole}
                        onValueChange={val => { if (val) setEditRole(val as UserRole); }}
                        className="w-full bg-muted/40 p-1 rounded-xl border flex"
                      >
                        <ToggleGroupItem value="staff"   className="flex-1 text-sm h-9 font-semibold">Nhân viên</ToggleGroupItem>
                        <ToggleGroupItem value="manager" className="flex-1 text-sm h-9 font-semibold">Quản lý</ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                    <div>
                      <Label className="text-xs text-muted font-medium flex items-center gap-1 mb-1">
                        <Building2 size={12} /> Bộ phận kho hàng
                      </Label>
                      <ToggleGroup
                        type="single"
                        value={editDepartment}
                        onValueChange={val => { if (val) setEditDepartment(val as UserDepartment); }}
                        className="w-full bg-muted/40 p-1 rounded-xl border flex"
                      >
                        <ToggleGroupItem value="restaurant" className="flex-1 text-xs h-9 font-semibold">Nhà hàng</ToggleGroupItem>
                        <ToggleGroupItem value="festival"   className="flex-1 text-xs h-9 font-semibold">Festival</ToggleGroupItem>
                        <ToggleGroupItem value="both"       className="flex-1 text-xs h-9 font-semibold">Cả hai</ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                className="flex-1 rounded-xl"
                onClick={saveEdit}
              >
                <Check size={14} /> Lưu
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setEditing(false)}
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
      </Card>

      {/* ── QUẢN LÝ TÀI KHOẢN (chỉ admin) ─────────────────────────────── */}
      {isAdmin && member.userId && (
        <Card className="p-4 space-y-4 border">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <KeyRound size={15} className="text-warning" /> Quản lý tài khoản
          </p>

          {/* Username */}
          <div>
            <Label className="text-xs text-muted font-medium block mb-1">Tên đăng nhập</Label>
            {currentUsername && (
              <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-default/50 rounded-lg border border-border">
                <span className="text-xs text-muted shrink-0">Hiện tại:</span>
                <span className="text-sm font-mono font-medium text-foreground/80 flex-1 truncate">
                  {currentUsername}<span className="text-muted">@fm.com</span>
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <div className="w-full flex-col gap-1 flex-1 flex">
                <div className="relative flex items-center">
                  <Input
                    placeholder="username mới"
                    className="pr-16"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                  />
                  <span className="absolute right-3 z-10 font-mono text-xs text-muted">@fm.com</span>
                </div>
              </div>
              <Button
                type="button"
                onClick={async () => {
                  if (!editUsername.trim()) return;
                  await supabase.from('users').update({ name: editUsername.trim() }).eq('id', member.userId!);
                  setCurrentUsername(editUsername.trim());
                  setEditUsername('');
                  setPwMsg('Đã cập nhật tên tài khoản!');
                  setTimeout(() => setPwMsg(''), 3000);
                }}
                className="rounded-xl h-9"
              >
                <Check size={13} /> Lưu
              </Button>
            </div>
          </div>

          {/* Mật khẩu */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label className="text-xs text-muted font-medium">Mật khẩu</Label>
              <Button
                type="button"
                variant={showPwForm ? 'outline' : 'secondary'}
                className="h-auto min-w-0"
                onClick={() => { setShowPwForm(!showPwForm); setPwMsg(''); setNewPassword(''); }}
              >
                {showPwForm ? 'Huỷ' : 'Đổi mật khẩu'}
              </Button>
            </div>
            {showPwForm && (
              <form onSubmit={handleChangePassword} className="flex gap-2 mt-2">
                <div className="w-full flex flex-col gap-1 flex-1 flex">
                  <Input
                    type="password"
                    minLength={6}
                    placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={pwLoading}
                  className="rounded-xl h-9 flex items-center gap-1"
                >
                  {pwLoading ? <Loader2 className="size-4 animate-spin" /> : <Check size={13} />}
                  Lưu
                </Button>
              </form>
            )}
          </div>

          {pwMsg && (
            <p className={`text-xs ${pwMsg.startsWith('Lỗi') ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}`}>{pwMsg}</p>
          )}
        </Card>
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
            <label className={`flex items-center gap-1 text-sm font-medium cursor-pointer px-3 py-1.5 rounded-lg border border-border transition-colors ${
              uploadingContract
                ? 'bg-default/50 text-muted'
                : 'bg-default/50 text-foreground/80 hover:border-accent/30 hover:text-foreground'
            }`}>
              {uploadingContract ? <Loader2 className="size-4 animate-spin" /> : <Upload size={14} />}
              {uploadingContract ? 'Đang upload...' : 'Upload hợp đồng'}
              <input ref={contractFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden" disabled={uploadingContract} onChange={handleContractUpload} />
            </label>
          )}
        </div>
        {member.contracts.length === 0 ? (
          <p className="text-xs text-muted py-4 text-center bg-surface border border-border border-dashed rounded-xl">
            Chưa có hợp đồng
          </p>
        ) : (
          <div className="space-y-2">
            {member.contracts.map(c => (
              <a
                key={c.id}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-surface border border-border rounded-xl shadow-sm p-3 hover:border-accent/30 transition-colors no-underline w-full"
              >
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
              type="button"
              className="h-9 px-4 text-sm rounded-xl font-medium"
              onClick={() => setShowExpenseForm(!showExpenseForm)}
            >
              <Plus size={14} /> Nộp chi phí
            </Button>
          )}
        </div>

        {showExpenseForm && (
          <Card className="mb-3 border">
            <form onSubmit={handleSubmitExpense} className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-success">Nộp chi phí mới</p>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-muted h-8 w-8 p-0 hover:text-danger rounded-full flex items-center justify-center"
                  onClick={() => setShowExpenseForm(false)}
                >
                  <X size={15} />
                </Button>
              </div>

              <div className="w-full flex flex-col gap-1">
                <Label className="text-xs font-medium text-foreground/80">Sự kiện *</Label>
                <Select
                  value={formEventId ? String(formEventId) : undefined}
                  onValueChange={(val) => setFormEventId(val ? Number(val) : '')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn sự kiện" />
                  </SelectTrigger>
                  <SelectContent>
                    {myEvents.map(ev => (
                      <SelectItem key={String(ev.id)} value={String(ev.id)}>
                        {ev.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="w-full flex flex-col gap-1">
                  <Label className="text-xs font-medium text-foreground/80">Loại chi phí</Label>
                  <Select
                    value={formCategory}
                    onValueChange={(val) => setFormCategory(val as ExpenseCategory)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Loại chi phí" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full flex flex-col gap-1">
                  <Label className="text-xs font-medium text-foreground/80">Số tiền (€)</Label>
                  <Input type="number" min={0} step={0.01} value={formAmount} onChange={(e) => setFormAmount(e.target.value)} required />
                </div>
              </div>

              <AppDatePicker
                label="Ngày"
                isRequired
                value={formDate}
                onChange={setFormDate}
              />

              <div>
                <Label className="text-xs text-foreground/80 font-medium block mb-1">Ảnh hóa đơn (không bắt buộc, tối đa 5MB)</Label>
                {expenseFile ? (
                  <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
                    <Image size={15} className="text-success shrink-0" />
                    <span className="text-xs text-foreground truncate flex-1">{expenseFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-muted hover:text-danger rounded-full flex items-center justify-center"
                      onClick={() => setExpenseFile(null)}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 border border-dashed border-border rounded-lg px-3 py-2.5 cursor-pointer hover:border-accent/30 hover:bg-default/50 transition-colors">
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
                  disabled={uploadingExp}
                  className="flex-1 rounded-xl h-9"
                >
                  {uploadingExp && <Loader2 className="size-4 animate-spin mr-1" />}
                  {uploadingExp ? 'Đang gửi...' : 'Gửi'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl h-9"
                  onClick={() => setShowExpenseForm(false)}
                >
                  Huỷ
                </Button>
              </div>
            </form>
          </Card>
        )}

        {allExpenses.length === 0 ? (
          <p className="text-xs text-muted text-center py-6 bg-surface border border-border rounded-xl border-dashed">Chưa có chi phí nào</p>
        ) : (
          <div className="space-y-2">
            {allExpenses.map(exp => (
              <Card key={exp.id} className="p-3 border">
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
              </Card>
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
    <Card className="p-3 space-y-2 border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-sm font-medium text-foreground">{label}</p>
        </div>
        <label className={`flex items-center gap-1 text-xs font-medium cursor-pointer px-2.5 py-1.5 rounded-lg border border-border transition-colors ${
          uploading
            ? 'bg-default/50 text-muted'
            : 'bg-default/50 text-foreground/80 hover:text-foreground hover:border-accent/30'
        }`}>
          {uploading ? <Loader2 className="size-3 animate-spin" /> : <Upload size={12} />}
          {uploading ? 'Uploading...' : doc ? 'Cập nhật' : 'Upload'}
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
            disabled={uploading} onChange={onUpload} />
        </label>
      </div>

      {cardNumber ? (
        <div className="flex items-center justify-between bg-default/50 rounded-lg px-3 py-2 border border-border">
          <span className="text-sm font-mono text-foreground tracking-wide">{cardNumber}</span>
          <Button
            type="button"
            variant="ghost"
            className="ml-2 h-7 w-7 p-0 flex items-center justify-center text-muted hover:text-foreground rounded-lg"
            aria-label="Sao chép"
            onClick={() => onCopy(cardNumber)}
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
    </Card>
  );
}
