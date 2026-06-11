import { useState, lazy, Suspense } from 'react';
import { ArrowLeft, Trash2, Download, Copy } from 'lucide-react';
import { Tooltip } from '@heroui/react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
// Lazy-load: @react-pdf/renderer rất nặng, chỉ tải khi mở chi tiết sự kiện.
const EventPDFExport = lazy(() => import('./EventPDFExport'));
import EventInfoTab       from './tabs/EventInfoTab';
import EventStaffTab      from './tabs/EventStaffTab';
import EventExpensesTab   from './tabs/EventExpensesTab';
import EventInventoryTab  from './tabs/EventInventoryTab';
import EventContractsTab  from './tabs/EventContractsTab';

interface EventDetailProps {
  eventId: number;
  onBack: () => void;
}

type Tab = 'info' | 'staff' | 'expenses' | 'inventory' | 'contracts';

const TABS: { id: Tab; label: string }[] = [
  { id: 'info',      label: 'Thông tin'  },
  { id: 'staff',     label: 'Nhân sự'    },
  { id: 'expenses',  label: 'Chi phí'    },
  { id: 'inventory', label: 'Kho'        },
  { id: 'contracts', label: 'Hợp đồng'  },
];

export default function EventDetail({ eventId, onBack }: EventDetailProps) {
  const { state, deleteEvent, cloneEvent } = useApp();
  const showToast = useToast();
  const event = state.events.find(e => e.id === eventId);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const isAdmin   = state.currentUser?.role === 'admin';
  const isManager = state.currentUser?.role === 'manager';
  void isManager;

  const handleClone = () => {
    if (!event) return;
    cloneEvent(event);
    showToast(`Đã nhân bản "${event.name}"`, 'success');
    onBack();
  };

  const handleDelete = () => {
    if (!event) return;
    if (window.confirm(`Xóa sự kiện "${event.name}"?\nThao tác này không thể hoàn tác.`)) {
      deleteEvent(event.id);
      onBack();
    }
  };

  const handleExport = async () => {
    if (!event) return;
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    const expTotal = Object.values(event.financials.expenses).reduce<number>((s, v) => s + (v ?? 0), 0);
    const infoRows = [
      { 'Thông tin': 'Tên sự kiện', 'Giá trị': event.name },
      { 'Thông tin': 'Ngày', 'Giá trị': event.date },
      { 'Thông tin': 'Địa điểm', 'Giá trị': event.location },
      { 'Thông tin': 'Trạng thái', 'Giá trị': event.status },
      { 'Thông tin': 'Doanh thu (€)', 'Giá trị': event.financials.income },
      { 'Thông tin': 'Chi phí (€)', 'Giá trị': expTotal },
      { 'Thông tin': 'Lợi nhuận (€)', 'Giá trị': event.financials.income - expTotal },
      { 'Thông tin': 'Số nhân viên', 'Giá trị': event.staff.length },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(infoRows), 'Thông tin');

    if (event.receipts.length > 0) {
      const expRows = event.receipts.map(r => ({
        'Nhân viên': r.staffName,
        'Loại': r.type,
        'Số tiền (€)': r.amount,
        'Ngày': r.date,
        'Trạng thái': r.status,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expRows), 'Chi phí');
    }

    const safeName = event.name.replace(/[/\\?%*:|"<>]/g, '-');
    XLSX.writeFile(wb, `su-kien-${safeName}.xlsx`);
  };

  if (!event) {
    return (
      <div className="text-center py-20 text-[var(--text-muted)]">
        <p>Không tìm thấy sự kiện</p>
        <button onClick={onBack} className="mt-4 text-[var(--primary)] text-sm">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          aria-label="Quay lại"
          className="p-1.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-[var(--text-primary)] text-lg truncate">{event.name}</h1>
          <p className="text-xs text-[var(--text-muted)]">{event.date} · {event.location}</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0">
            <Tooltip>
              <Tooltip.Trigger>
                <button
                  onClick={handleExport}
                  className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
                  aria-label="Xuất Excel"
                >
                  <Download size={18} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content placement="bottom">Xuất Excel</Tooltip.Content>
            </Tooltip>
            <Suspense fallback={
              <span className="px-3 py-1.5 text-sm text-[var(--text-muted)]">PDF…</span>
            }>
              <EventPDFExport event={event} />
            </Suspense>
            <Tooltip>
              <Tooltip.Trigger>
                <button
                  onClick={handleClone}
                  className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--success)] hover:bg-[var(--success)]/10 transition-colors"
                  aria-label="Nhân bản sự kiện"
                >
                  <Copy size={18} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content placement="bottom">Nhân bản sự kiện</Tooltip.Content>
            </Tooltip>
            <Tooltip>
              <Tooltip.Trigger>
                <button
                  onClick={handleDelete}
                  className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                  aria-label="Xóa sự kiện"
                >
                  <Trash2 size={18} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content placement="bottom">Xóa sự kiện</Tooltip.Content>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--glass-border)] mb-4 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'info'      && <EventInfoTab event={event} />}
      {activeTab === 'staff'     && <EventStaffTab event={event} />}
      {activeTab === 'expenses'  && <EventExpensesTab event={event} />}
      {activeTab === 'inventory' && <EventInventoryTab event={event} />}
      {activeTab === 'contracts' && <EventContractsTab event={event} />}
    </div>
  );
}
