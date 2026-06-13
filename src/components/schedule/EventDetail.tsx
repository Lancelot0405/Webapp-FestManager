import { useState, lazy, Suspense } from 'react';
import { ArrowLeft, Trash2, Download, Copy } from 'lucide-react';
import { Tooltip, ScrollShadow, Button } from '@heroui/react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
// Lazy-load: @react-pdf/renderer rất nặng, chỉ tải khi mở chi tiết sự kiện.
const EventPDFExport = lazy(() => import('./EventPDFExport'));
import EventInfoTab       from './tabs/EventInfoTab';
import EventStaffTab      from './tabs/EventStaffTab';
import EventExpensesTab   from './tabs/EventExpensesTab';
import EventInventoryTab  from './tabs/EventInventoryTab';
import EventContractsTab  from './tabs/EventContractsTab';


type Tab = 'info' | 'contracts' | 'staff' | 'inventory' | 'expenses';

const TABS: { id: Tab; label: string }[] = [
  { id: 'info',      label: 'Thông tin'  },
  { id: 'contracts', label: 'Hợp đồng'  },
  { id: 'staff',     label: 'Nhân sự'    },
  { id: 'inventory', label: 'Kho'        },
  { id: 'expenses',  label: 'Chi phí'    },
];

import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import { useDeleteEventMutation, useCloneEventMutation } from '../../hooks/queries/useMutations';
import { useParams, useNavigate } from 'react-router-dom';

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { state } = useApp();
  const { data: events = [] } = useEventsQuery();
  const deleteEventMutation = useDeleteEventMutation();
  const cloneEventMutation = useCloneEventMutation();
  const eventIdNum = Number(eventId);
  const event = events.find(e => e.id === eventIdNum);
  const showToast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const isAdmin   = state.currentUser?.role === 'admin';
  const isManager = state.currentUser?.role === 'manager';
  void isManager;

  const handleClone = () => {
    if (!event) return;
    cloneEventMutation.mutate(event);
    showToast(`Đã nhân bản "${event.name}"`, 'success');
    navigate('/schedule');
  };

  const handleDelete = () => {
    if (!event) return;
    if (window.confirm(`Xóa sự kiện "${event.name}"?\nThao tác này không thể hoàn tác.`)) {
      deleteEventMutation.mutate(event.id);
      navigate('/schedule');
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
        <Button variant="ghost" onPress={() => navigate('/schedule')} className="mt-4 h-auto min-w-0 p-0 text-[var(--primary)] text-sm">Quay lại</Button>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          isIconOnly
          variant="ghost"
          onPress={() => navigate(-1)}
          aria-label="Quay lại"
          className="h-auto min-w-0 p-1.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-[var(--text-primary)] text-lg truncate">{event.name}</h1>
          <p className="text-xs text-[var(--text-muted)]">{event.date} · {event.location}</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0">
            <Tooltip>
              <Tooltip.Trigger>
                <Button
                  isIconOnly
                  variant="ghost"
                  onPress={handleExport}
                  className="h-auto min-w-0 p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
                  aria-label="Xuất Excel"
                >
                  <Download size={18} />
                </Button>
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
                <Button
                  isIconOnly
                  variant="ghost"
                  onPress={handleClone}
                  className="h-auto min-w-0 p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--success)] hover:bg-[var(--success)]/10 transition-colors"
                  aria-label="Nhân bản sự kiện"
                >
                  <Copy size={18} />
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content placement="bottom">Nhân bản sự kiện</Tooltip.Content>
            </Tooltip>
            <Tooltip>
              <Tooltip.Trigger>
                <Button
                  isIconOnly
                  variant="ghost"
                  onPress={handleDelete}
                  className="h-auto min-w-0 p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                  aria-label="Xóa sự kiện"
                >
                  <Trash2 size={18} />
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content placement="bottom">Xóa sự kiện</Tooltip.Content>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Tabs */}
      <ScrollShadow orientation="horizontal" className="mb-4">
        <div className="flex border-b border-[var(--glass-border)]">
          {TABS.map(tab => (
            <Button
              key={tab.id}
              variant="ghost"
              onPress={() => setActiveTab(tab.id)}
              className={`h-auto min-w-0 -mb-px whitespace-nowrap rounded-none border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </ScrollShadow>

      {/* Tab content */}
      {activeTab === 'info'      && <EventInfoTab event={event} />}
      {activeTab === 'staff'     && <EventStaffTab event={event} />}
      {activeTab === 'expenses'  && <EventExpensesTab event={event} />}
      {activeTab === 'inventory' && <EventInventoryTab event={event} />}
      {activeTab === 'contracts' && <EventContractsTab event={event} />}
    </div>
  );
}
