import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import type { StaffMember, StaffType } from '../../types';

const DOMAIN = '@festmanager.com';

interface Props {
  onClose: () => void;
}

export default function AddStaffForm({ onClose }: Props) {
  const { addStaff } = useApp();
  const showToast = useToast();
  const [name,      setName]      = useState('');
  const [dob,       setDob]       = useState('');
  const [city,      setCity]      = useState('');
  const [staffType, setStaffType] = useState<StaffType>('permanent');
  const [username,  setUsername]  = useState('');
  const [loading,   setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim()) return;
    setLoading(true);

    const dobFormatted = dob
      ? (() => { const [yyyy, mm, dd] = dob.split('-'); return `${dd}-${mm}-${yyyy}`; })()
      : '';

    let userId: string | undefined;

    if (username.trim()) {
      const email = username.trim().toLowerCase() + DOMAIN;
      const tempPassword = 'FestManager123!';
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { name: name.trim() },
      });
      if (error) {
        showToast(`Lỗi tạo tài khoản: ${error.message}`, 'error');
        setLoading(false);
        return;
      }
      userId = data.user?.id;
      if (userId) {
        await supabase.from('users').upsert({
          id: userId,
          name: name.trim(),
          role: 'staff',
        });
      }
    }

    const newStaff: StaffMember = {
      id: Date.now(),
      userId,
      name: name.trim(),
      dob: dobFormatted,
      city: city.trim(),
      staffType,
      contracts: [],
    };
    addStaff(newStaff, userId);
    showToast('Đã thêm nhân viên', 'success');
    setLoading(false);
    onClose();
  };

  return (
    <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <p className="font-semibold text-gray-800">Thêm nhân viên mới</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600">Tên *</label>
          <input
            required
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Nguyễn Văn A"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Tên đăng nhập <span className="text-gray-400 font-normal">(để tạo tài khoản)</span></label>
          <div className="mt-1 flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <input
              className="flex-1 px-3 py-2 text-sm focus:outline-none"
              placeholder="nguyenvana"
              value={username}
              onChange={e => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
            />
            <span className="px-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200 py-2 shrink-0">@festmanager.com</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Mật khẩu mặc định: FestManager123!</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Ngày sinh</label>
          <input
            type="date"
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={dob}
            onChange={e => setDob(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Thành phố *</label>
          <input
            required
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Paris"
            value={city}
            onChange={e => setCity(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Loại nhân viên</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setStaffType('permanent')}
              className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                staffType === 'permanent'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              Nhân viên cứng
            </button>
            <button
              type="button"
              onClick={() => setStaffType('part-time')}
              className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                staffType === 'part-time'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
              }`}
            >
              Part-time
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg text-sm disabled:opacity-60"
        >
          {loading ? 'Đang tạo...' : 'Thêm nhân viên'}
        </button>
      </form>
    </div>
  );
}
