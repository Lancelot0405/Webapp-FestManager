import { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, Upload, Loader, FileText } from 'lucide-react';
import DocThumbnail from '../../shared/DocThumbnail';
import { useApp } from '../../../context/AppContext';
import { supabase } from '../../../lib/supabase';
import { getErrorMessage } from '../../../lib/errors';
import type { FestivalEvent } from '../../../types';

interface Props {
  event: FestivalEvent;
}

const MAX_FILE_MB = 10;

export default function EventContractsTab({ event }: Props) {
  const { state, addContract } = useApp();
  const { currentUser, staff } = state;
  const isAdmin    = currentUser?.role === 'admin';
  const isManager  = currentUser?.role === 'manager';
  const canViewAll = isAdmin || isManager;

  const myStaffMember = currentUser
    ? (staff.find(s => s.userId === currentUser.id)
       ?? staff.find(s => s.name.toLowerCase() === currentUser.name.toLowerCase()))
    : null;
  const myNumericStaffId = myStaffMember?.id ?? null;

  const [expandedStaff, setExpandedStaff] = useState<number | null>(null);
  const [uploading, setUploading]         = useState(false);
  const [uploadingFor, setUploadingFor]   = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggle = (staffId: number) =>
    setExpandedStaff(prev => (prev === staffId ? null : staffId));

  const handleUpload = async (staffId: number, file: File) => {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      alert(`File quá lớn. Vui lòng chọn file dưới ${MAX_FILE_MB}MB.`);
      return;
    }
    setUploading(true);
    setUploadingFor(staffId);
    try {
      const ext  = file.name.split('.').pop();
      const path = `staff-${staffId}/event-${event.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('contracts').upload(path, file);
      if (error) throw error;
      const url = supabase.storage.from('contracts').getPublicUrl(path).data.publicUrl;

      const today = new Date();
      const date  = `${String(today.getDate()).padStart(2,'0')}-${String(today.getMonth()+1).padStart(2,'0')}-${today.getFullYear()}`;

      addContract(staffId, {
        id: Date.now(),
        date,
        url,
        fileName: file.name,
        festivalId: event.id,
      });

      setExpandedStaff(staffId);
    } catch (err) {
      alert(getErrorMessage(err, 'Upload thất bại. Vui lòng thử lại.'));
    } finally {
      setUploading(false);
      setUploadingFor(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Lấy danh sách staff trong event, bổ sung thêm contracts từ state
  const staffWithContracts = event.staff.map(ref => {
    const fullMember = staff.find(s => s.id === ref.id);
    const eventContracts = (fullMember?.contracts ?? []).filter(
      c => c.festivalId === event.id
    );
    return { ref, eventContracts };
  });

  if (staffWithContracts.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        Chưa có nhân viên được phân công cho sự kiện này
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        Hợp đồng đã ký cho sự kiện này
      </p>

      {staffWithContracts.map(({ ref, eventContracts }) => {
        const isMe   = !canViewAll && ref.id === myNumericStaffId;
        const isOpen = expandedStaff === ref.id;
        const isBusy = uploading && uploadingFor === ref.id;

        // Staff chỉ thấy section của mình; admin thấy tất cả
        if (!canViewAll && !isMe) return null;

        return (
          <div key={ref.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Header */}
            <button
              className="w-full flex justify-between items-center px-4 py-3 text-left"
              onClick={() => toggle(ref.id)}
            >
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {ref.name}
                  {isMe && <span className="ml-2 text-xs text-blue-500 font-normal">(bạn)</span>}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {eventContracts.length > 0
                    ? `${eventContracts.length} hợp đồng`
                    : 'Chưa có hợp đồng'}
                </p>
              </div>
              {isOpen
                ? <ChevronUp size={16} className="text-gray-400 dark:text-gray-500" />
                : <ChevronDown size={16} className="text-gray-400 dark:text-gray-500" />}
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 dark:border-slate-700">
                {/* Upload button — nhân viên tự upload, hoặc admin upload hộ */}
                {(isMe || isAdmin) && !isManager && (
                  <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                    <label className={`flex items-center gap-2 cursor-pointer w-fit ${isBusy ? 'opacity-60 pointer-events-none' : ''}`}>
                      {isBusy
                        ? <Loader size={14} className="animate-spin text-blue-500" />
                        : <Upload size={14} className="text-blue-500" />}
                      <span className="text-sm text-blue-600 font-medium">
                        {isBusy ? 'Đang tải lên...' : 'Upload hợp đồng đã ký'}
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(ref.id, file);
                        }}
                      />
                    </label>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Ảnh hoặc PDF, tối đa {MAX_FILE_MB}MB</p>
                  </div>
                )}

                {/* Danh sách hợp đồng */}
                <div className="divide-y divide-gray-50 dark:divide-slate-700">
                  {eventContracts.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">Chưa có hợp đồng nào được tải lên</p>
                  ) : (
                    eventContracts.map(c => (
                      <div key={c.id} className="px-4 py-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-blue-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                              {c.fileName ?? 'Hợp đồng'}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{c.date}</p>
                          </div>
                        </div>
                        <DocThumbnail url={c.url} fileName={c.fileName ?? 'Hợp đồng'} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
