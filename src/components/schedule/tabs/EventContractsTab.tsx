import { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, Upload, Loader, FileText } from 'lucide-react';
import { Button } from '@heroui/react';
import DocThumbnail from '../../shared/DocThumbnail';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import { supabase } from '../../../lib/supabase';
import { getErrorMessage } from '../../../lib/errors';
import type { FestivalEvent } from '../../../types';

interface Props {
  event: FestivalEvent;
}

const MAX_FILE_MB = 10;

export default function EventContractsTab({ event }: Props) {
  const { state, addContract } = useApp();
  const showToast = useToast();
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
      showToast(`File quá lớn. Vui lòng chọn file dưới ${MAX_FILE_MB}MB.`, 'warning');
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
      showToast(getErrorMessage(err, 'Upload thất bại. Vui lòng thử lại.'), 'error');
    } finally {
      setUploading(false);
      setUploadingFor(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const staffWithContracts = event.staff.map(ref => {
    const fullMember = staff.find(s => s.id === ref.id);
    const eventContracts = (fullMember?.contracts ?? []).filter(
      c => c.festivalId === event.id
    );
    return { ref, eventContracts };
  });

  if (staffWithContracts.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)] text-center py-8">
        Chưa có nhân viên được phân công cho sự kiện này
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-[var(--text-muted)] mb-3">
        Hợp đồng đã ký cho sự kiện này
      </p>

      {staffWithContracts.map(({ ref, eventContracts }) => {
        const isMe   = !canViewAll && ref.id === myNumericStaffId;
        const isOpen = expandedStaff === ref.id;
        const isBusy = uploading && uploadingFor === ref.id;

        if (!canViewAll && !isMe) return null;

        return (
          <div key={ref.id} className="glass-card rounded-xl overflow-hidden">
            {/* Header */}
            <Button
              variant="ghost"
              className="w-full h-auto justify-between rounded-none px-4 py-3 text-left"
              onPress={() => toggle(ref.id)}
            >
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {ref.name}
                  {isMe && <span className="ml-2 text-xs text-[var(--primary)] font-normal">(bạn)</span>}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {eventContracts.length > 0
                    ? `${eventContracts.length} hợp đồng`
                    : 'Chưa có hợp đồng'}
                </p>
              </div>
              {isOpen
                ? <ChevronUp size={16} className="text-[var(--text-muted)]" />
                : <ChevronDown size={16} className="text-[var(--text-muted)]" />
              }
            </Button>

            {isOpen && (
              <div className="border-t border-[var(--glass-border)]">
                {/* Upload button */}
                {(isMe || isAdmin) && !isManager && (
                  <div className="px-4 py-3 bg-[var(--glass-bg)] border-b border-[var(--glass-border)]">
                    <label className={`flex items-center gap-2 cursor-pointer w-fit ${isBusy ? 'opacity-60 pointer-events-none' : ''}`}>
                      {isBusy
                        ? <Loader size={14} className="animate-spin text-[var(--primary)]" />
                        : <Upload size={14} className="text-[var(--primary)]" />
                      }
                      <span className="text-sm text-[var(--primary)] font-semibold">
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
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Ảnh hoặc PDF, tối đa {MAX_FILE_MB}MB</p>
                  </div>
                )}

                {/* Danh sách hợp đồng */}
                <div className="divide-y divide-[var(--glass-border)]">
                  {eventContracts.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-[var(--text-muted)]">Chưa có hợp đồng nào được tải lên</p>
                  ) : (
                    eventContracts.map(c => (
                      <div key={c.id} className="px-4 py-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-[var(--text-muted)] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                              {c.fileName ?? 'Hợp đồng'}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">{c.date}</p>
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
