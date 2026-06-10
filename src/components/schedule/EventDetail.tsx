// =============================================================================
// src/components/schedule/EventDetail.tsx
// =============================================================================

import { useState, lazy, Suspense } from 'react';
import { ArrowLeft, Trash2, Download, Copy } from 'lucide-react';
import { Button } from '@heroui/react';
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
      <div className="text-center py-20 text-espresso-400">
        <p>Không tìm thấy sự kiện</p>
        <Button onPress={onBack} variant="ghost" size="sm" className="mt-4 text-brand-600">
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          onPress={onBack}
          variant="ghost"
          isIconOnly
          size="sm"
          aria-label="Quay lại"
          className="text-espresso-500 hover:text-espresso-700 dark:text-brand-300 dark:hover:text-gray-200"
        >
          <ArrowLeft size={22} />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-espresso-800 dark:text-espresso-50 text-lg truncate">{event.name}</h1>
          <p className="text-xs text-espresso-500 dark:text-brand-300">{event.date} · {event.location}</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              onPress={handleExport}
              variant="ghost"
              isIconOnly
              size="sm"
              className="text-brand-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
              aria-label="Xuất Excel"
            >
              <Download size={18} />
            </Button>
            <Suspense fallback={
              <span className="px-3 py-1.5 text-sm text-espresso-400">PDF…</span>
            }>
              <EventPDFExport event={event} />
            </Suspense>
            <Button
              onPress={handleClone}
              variant="ghost"
              isIconOnly
              size="sm"
              className="text-herb-500 hover:text-herb-600 hover:bg-herb-50 rounded-lg"
              aria-label="Nhân bản sự kiện"
            >
              <Copy size={18} />
            </Button>
            <Button
              onPress={handleDelete}
              variant="ghost"
              isIconOnly
              size="sm"
              className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              aria-label="Xóa sự kiện"
            >
              <Trash2 size={18} />
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-200 dark:border-espresso-700 mb-4 overflow-x-auto">
        {TABS.map(tab => (
          <Button
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            variant="ghost"
            size="sm"
            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 rounded-none h-auto transition-colors ${
              activeTab === tab.id
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-espresso-500 dark:text-brand-300 hover:text-espresso-700 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </Button>
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
