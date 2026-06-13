import { useState, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Download, Copy } from 'lucide-react';
import { Tooltip, ScrollShadow, Button } from '@heroui/react';
import { useApp } from '../../context/AppContext';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import { useDeleteEvent } from '../../hooks/queries/mutations/useDeleteEvent';
import { useCloneEvent } from '../../hooks/queries/mutations/useCloneEvent';
import { useToast } from '../../context/ToastContext';
const EventPDFExport = lazy(() => import('./EventPDFExport'));
import EventInfoTab       from './tabs/EventInfoTab';
import EventStaffTab      from './tabs/EventStaffTab';
import EventExpensesTab   from './tabs/EventExpensesTab';
import EventInventoryTab  from './tabs/EventInventoryTab';
import EventContractsTab  from './tabs/EventContractsTab';

type Tab = 'info' | 'staff' | 'expenses' | 'inventory' | 'contracts';

const TABS: { id: Tab; label: string }[] = [
  { id: 'info',      label: 'Thông tin' },
  { id: 'staff',     label: 'Nhân sự'   },
  { id: 'expenses',  label: 'Chi phí'   },
  { id: 'inventory', label: 'Kho'       },
  { id: 'contracts', label: 'Hợp đồng' },
];

export default function EventDetail() {
  const { eventId: eventIdParam } = useParams<{ eventId: string }>();
  const navigate   = useNavigate();
  const { currentUser } = useApp();
  const showToast  = useToast();
  const { data: events = [] } = useEventsQuery();
  const deleteEventMutation   = useDeleteEvent();
  const cloneEventMutation    = useCloneEvent();

  const eventId = Number(eventIdParam);
  const event   = events.find(e => e.id === eventId);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const isAdmin = currentUser?.role === 'admin';

  const handleClone = () => {
    if (!event) return;
    cloneEventMutation.mutate(event, {
      onSuccess: () => {
        showToast(`Đã nhân bản "${event.name}"`, 'success');
        navigate('/schedule');
      },
    });
  };

  const handleDelete = () => {
    if (!event) return;
    if (window.confirm(`Xóa sự kiện "${event.name}"?\nThao tác này không thể hoàn tác.`)) {
      deleteEventMutation.mutate(event.id, {
        onSuccess: () => navigate('/schedule'),
      });
    }
  };

  const handleExport = async () => {
    if (!event) return;
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    const expTotal = Object.values(event.financials.expenses).reduce<number>((s, v) => s + (v ?? 0), 0);
    const infoRows = [
      { 'Thông tin': 'Tên sự kiện',  'Giá trị': event.name },
      { 'Thông tin': 'Ngày',         'Giá trị': event.date },
      { 'Thông tin': 'Địa điểm',     'Giá trị': event.location },
      { 'Thông tin': 'Trạng thái',   'Giá trị': event.status },
      { 'Thông tin': 'Doanh thu (€)', 'Giá trị': event.financials.income },
      { 'Thông tin': 'Chi phí (€)',   'Giá trị': expTotal },
      { 'Thông tin': 'Lợi nhuận (€)', 'Giá trị': event.financials.income - expTotal },
      { 'Thông tin': 'Số nhân viên', 'Giá trị': event.staff.length },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(infoRows), 'Thông tin');
    if (event.receipts.length > 0) {
      const expRows = event.receipts.map(r => ({
        'Nhân viên': r.staffName, 'Loại': r.type,
        'Số tiền (€)': r.amount, 'Ngày': r.date, 'Trạng thái': r.status,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expRows), 'Chi phí');
    }
    const safeName = event.name.replace(/[/\\?%*:|"<>]/g, '-');
    XLSX.writeFile(wb, `su-kien-${safeName}.xlsx`);
  };

  if (!event) {
    return (
      <div className="text-center py-20 text-muted">
        <p>Không tìm thấy sự kiện</p>
        <Button variant="ghost" onPress={() => navigate(-1)} className="mt-4 h-auto min-w-0 p-0 text-accent text-sm">Quay lại</Button>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button isIconOnly variant="ghost" onPress={() => navigate(-1)} aria-label="Quay lại"
          className="h-auto min-w-0 p-1.5 rounded-xl bg-default/50 border border-separator text-muted hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-foreground text-lg truncate">{event.name}</h1>
          <p className="text-xs text-muted">{event.date} · {event.location}</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0">
            <Tooltip>
              <Tooltip.Trigger>
                <Button isIconOnly variant="ghost" onPress={handleExport}
                  className="h-auto min-w-0 p-2 rounded-xl text-muted hover:text-accent hover:bg-accent/10 transition-colors" aria-label="Xuất Excel">
                  <Download size={18} />
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content placement="bottom">Xuất Excel</Tooltip.Content>
            </Tooltip>
            <Suspense fallback={<span className="px-3 py-1.5 text-sm text-muted">PDF…</span>}>
              <EventPDFExport event={event} />
            </Suspense>
            <Tooltip>
              <Tooltip.Trigger>
                <Button isIconOnly variant="ghost" onPress={handleClone}
                  className="h-auto min-w-0 p-2 rounded-xl text-muted hover:text-success hover:bg-success/10 transition-colors" aria-label="Nhân bản sự kiện">
                  <Copy size={18} />
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content placement="bottom">Nhân bản sự kiện</Tooltip.Content>
            </Tooltip>
            <Tooltip>
              <Tooltip.Trigger>
                <Button isIconOnly variant="ghost" onPress={handleDelete}
                  className="h-auto min-w-0 p-2 rounded-xl text-muted hover:text-danger hover:bg-danger/10 transition-colors" aria-label="Xóa sự kiện">
                  <Trash2 size={18} />
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content placement="bottom">Xóa sự kiện</Tooltip.Content>
            </Tooltip>
          </div>
        )}
      </div>

      {/* 2-panel layout: info panel cố định bên trái trên desktop */}
      <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-6 lg:items-start">
        {/* Panel trái: thông tin sự kiện — chỉ hiện trên desktop */}
        <aside className="hidden lg:block bg-surface border border-separator rounded-xl rounded-xl overflow-hidden">
          <EventInfoTab event={event} />
        </aside>

        {/* Phần phải: tabs + content */}
        <div>
          <ScrollShadow orientation="horizontal" className="mb-4">
            <div className="flex border-b border-separator">
              {TABS.map(tab => (
                <Button key={tab.id} variant="ghost" onPress={() => setActiveTab(tab.id)}
                  className={`${tab.id === 'info' ? 'lg:hidden' : ''} h-auto min-w-0 -mb-px whitespace-nowrap rounded-none border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-foreground'}`}>
                  {tab.label}
                </Button>
              ))}
            </div>
          </ScrollShadow>

          {/* Tab info: chỉ render trên mobile (desktop dùng panel trái) */}
          {activeTab === 'info' && <div className="lg:hidden"><EventInfoTab event={event} /></div>}
          {activeTab === 'staff'     && <EventStaffTab event={event} />}
          {activeTab === 'expenses'  && <EventExpensesTab event={event} />}
          {activeTab === 'inventory' && <EventInventoryTab event={event} />}
          {activeTab === 'contracts' && <EventContractsTab event={event} />}
        </div>
      </div>
    </div>
  );
}
