import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import type { StaffMember, StaffType } from '../../types';

const DOMAIN = '@fm.com';

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
      const tempPassword = 'fest1234';
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm px-0">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up">
      <div className="px-5 pt-5 pb-[calc(env(safe-area-inset-bottom,0px)+80px)] max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <div className="flex justify-between items-center mb-5">
          <p className="text-base font-bold text-gray-800 dark:text-gray-100">Thêm nhân viên mới</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Tên *</label>
            <input
              required
              className="w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all"
              placeholder="Nguyễn Văn A"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">
              Tên đăng nhập <span className="font-normal text-gray-400 dark:text-gray-500">(để tạo tài khoản)</span>
            </label>
            <div className="flex items-stretch border border-gray-200 dark:border-slate-600 rounded-xl overflow-hidden focus-within:border-blue-400 transition-all">
              <input
                className="flex-1 px-3 py-2.5 text-sm bg-white dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-500 focus:outline-none"
                placeholder="nguyenvana"
                value={username}
                onChange={e => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
              />
              <span className="px-2.5 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-600 border-l border-gray-200 dark:border-slate-500 flex items-center shrink-0 font-mono">
                @fm.com
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Mật khẩu mặc định: <span className="font-semibold text-gray-700 dark:text-gray-300">fest1234</span>
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Ngày sinh</label>
            <div className="overflow-hidden rounded-xl">
              <input
                type="date"
                className="border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all"
                value={dob}
                onChange={e => setDob(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Thành phố *</label>
            <input
              required
              className="w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all"
              placeholder="Paris"
              value={city}
              onChange={e => setCity(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Loại nhân viên</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setStaffType('permanent')}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  staffType === 'permanent'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:border-blue-300'
                }`}
              >
                Nhân viên cứng
              </button>
              <button
                type="button"
                onClick={() => setStaffType('part-time')}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  staffType === 'part-time'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:border-purple-300'
                }`}
              >
                Part-time
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-60 transition-colors shadow-md"
          >
            {loading ? 'Đang tạo...' : 'Thêm nhân viên'}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
