// =============================================================================
// src/components/schedule/EventDetail.tsx
// =============================================================================

import { useState, lazy, Suspense } from 'react';
import { ArrowLeft, Trash2, Download, Copy } from 'lucide-react';
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
    // Tải xlsx động — chỉ nạp khi người dùng thực sự export.
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    // Sheet 1: Event info
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

    // Sheet 2: Expenses
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
      <div className="text-center py-20 text-gray-400">
        <p>Không tìm thấy sự kiện</p>
        <button onClick={onBack} className="mt-4 text-blue-600 text-sm">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft size={22} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-gray-800 dark:text-gray-100 text-lg truncate">{event.name}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{event.date} · {event.location}</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleExport}
              className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Xuất Excel"
            >
              <Download size={18} />
            </button>
            <Suspense fallback={
              <span className="px-3 py-1.5 text-sm text-gray-400">PDF…</span>
            }>
              <EventPDFExport event={event} />
            </Suspense>
            <button
              onClick={handleClone}
              className="p-2 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Nhân bản sự kiện"
            >
              <Copy size={18} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Xóa sự kiện"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-700 mb-4 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
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
