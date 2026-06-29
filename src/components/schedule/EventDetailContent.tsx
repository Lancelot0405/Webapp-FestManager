import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, X, Trash2, Download, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useApp } from '../../context/AppContext';
import { useDeleteEvent } from '../../hooks/queries/mutations/useDeleteEvent';
import { useCloneEvent } from '../../hooks/queries/mutations/useCloneEvent';
import { useToast } from '../../context/ToastContext';
import { cn } from '@/lib/utils';
const EventPDFExport = lazy(() => import('./EventPDFExport'));
import EventInfoTab       from './tabs/EventInfoTab';
import EventStaffTab      from './tabs/EventStaffTab';
import EventExpensesTab   from './tabs/EventExpensesTab';
import EventInventoryTab  from './tabs/EventInventoryTab';
import EventContractsTab  from './tabs/EventContractsTab';
import type { FestivalEvent } from '../../types';

type Tab = 'info' | 'staff' | 'expenses' | 'inventory' | 'contracts';

const TABS: { id: Tab; label: string }[] = [
  { id: 'info',      label: 'Thông tin' },
  { id: 'staff',     label: 'Nhân sự'   },
  { id: 'expenses',  label: 'Chi phí'   },
  { id: 'inventory', label: 'Kho'       },
  { id: 'contracts', label: 'Hợp đồng' },
];

interface Props {
  event: FestivalEvent;
  onClose: () => void;
  variant?: 'page' | 'drawer';
}

export default function EventDetailContent({ event, onClose, variant = 'page' }: Props) {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const showToast  = useToast();
  const deleteEventMutation = useDeleteEvent();
  const cloneEventMutation  = useCloneEvent();

  const [activeTab, setActiveTab] = useState<Tab>('info');
  const isAdmin   = currentUser?.role === 'admin';
  const isDrawer  = variant === 'drawer';

  const handleClone = () => {
    cloneEventMutation.mutate(event, {
      onSuccess: () => {
        showToast(`Đã nhân bản "${event.name}"`, 'success');
        if (isDrawer) onClose();
        else navigate('/schedule');
      },
    });
  };

  const handleDelete = () => {
    if (window.confirm(`Xóa sự kiện "${event.name}"?\nThao tác này không thể hoàn tác.`)) {
      deleteEventMutation.mutate(event.id, {
        onSuccess: () => onClose(),
      });
    }
  };

  const handleExport = async () => {
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

  return (
    <div className={isDrawer ? '' : 'pb-6'}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          aria-label={isDrawer ? 'Đóng' : 'Quay lại'}
          className="h-9 w-9 shrink-0 p-0 rounded-xl bg-muted/40 border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
        >
          {isDrawer ? <X size={20} /> : <ArrowLeft size={20} />}
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-foreground text-lg truncate">{event.name}</h1>
          <p className="text-xs text-muted-foreground">{event.date} · {event.location}</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleExport}
                    className="h-9 w-9 shrink-0 p-0 rounded-xl text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors flex items-center justify-center"
                    aria-label="Xuất Excel"
                  >
                    <Download size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Xuất Excel</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Suspense fallback={<span className="px-3 py-1.5 text-sm text-muted-foreground">PDF…</span>}>
              <EventPDFExport event={event} />
            </Suspense>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleClone}
                    className="h-9 w-9 shrink-0 p-0 rounded-xl text-muted-foreground hover:text-success hover:bg-success/10 transition-colors flex items-center justify-center"
                    aria-label="Nhân bản sự kiện"
                  >
                    <Copy size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Nhân bản sự kiện</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleDelete}
                    className="h-9 w-9 shrink-0 p-0 rounded-xl text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors flex items-center justify-center"
                    aria-label="Xóa sự kiện"
                  >
                    <Trash2 size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Xóa sự kiện</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {/* 2-panel layout: info panel cố định bên trái trên desktop (chỉ ở chế độ page) */}
      <div className={isDrawer ? '' : 'lg:grid lg:grid-cols-[320px_1fr] lg:gap-6 lg:items-start'}>
        {!isDrawer && (
          <aside className="hidden lg:block bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <EventInfoTab event={event} />
          </aside>
        )}

        {/* Phần phải: tabs + content */}
        <div>
          <div className="flex border-b border-border w-full overflow-x-auto scrollbar-hide gap-4 mb-4">
            {TABS.map((tab) => {
              const isSelected = activeTab === tab.id;
              const hideInfoOnDesktop = !isDrawer && tab.id === 'info';
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative pb-2.5 text-xs sm:text-sm font-semibold transition-colors focus:outline-none whitespace-nowrap",
                    hideInfoOnDesktop && "lg:hidden",
                    isSelected ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {activeTab === 'info' && <div className={isDrawer ? '' : 'lg:hidden'}><EventInfoTab event={event} /></div>}
              {activeTab === 'staff'     && <EventStaffTab event={event} />}
              {activeTab === 'expenses'  && <EventExpensesTab event={event} />}
              {activeTab === 'inventory' && <EventInventoryTab event={event} />}
              {activeTab === 'contracts' && <EventContractsTab event={event} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
