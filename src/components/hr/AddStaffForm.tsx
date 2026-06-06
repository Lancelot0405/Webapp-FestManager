import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { StaffMember, StaffType } from '../../types';

interface Props {
  onClose: () => void;
}

export default function AddStaffForm({ onClose }: Props) {
  const { addStaff } = useApp();
  const [name,      setName]      = useState('');
  const [dob,       setDob]       = useState('');
  const [city,      setCity]      = useState('');
  const [staffType, setStaffType] = useState<StaffType>('permanent');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim()) return;
    const dobFormatted = dob
      ? (() => { const [yyyy, mm, dd] = dob.split('-'); return `${dd}-${mm}-${yyyy}`; })()
      : '';
    const newStaff: StaffMember = {
      id: Date.now(),
      name: name.trim(),
      dob: dobFormatted,
      city: city.trim(),
      staffType,
      contracts: [],
    };
    addStaff(newStaff);
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
          <label className="text-xs font-medium text-gray-600">Tên</label>
          <input
            required
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Nguyễn Văn A"
            value={name}
            onChange={e => setName(e.target.value)}
          />
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
          <label className="text-xs font-medium text-gray-600">Thành phố</label>
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
          className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg text-sm"
        >
          Thêm nhân viên
        </button>
      </form>
    </div>
  );
}
