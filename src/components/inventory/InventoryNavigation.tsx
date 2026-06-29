import { Store, Tent } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { MainTab, SubTab, StatusFilter } from './useInventoryFilters';

interface Props {
  mainTab: MainTab;
  subTab: SubTab;
  statusFilter: StatusFilter;
  statusCounts: { all: number; low: number; warn: number; ok: number };
  canSeeRestaurant: boolean;
  canSeeFestival: boolean;
  countFor: (m: MainTab, s: 'food' | 'equipment') => number;
  sectionLogsCount: number;
  onMainTabChange: (tab: MainTab) => void;
  onSubTabChange: (tab: SubTab) => void;
  onStatusFilterChange: (status: StatusFilter) => void;
  actionSlot?: React.ReactNode;
  summarySlot?: React.ReactNode;
  toolbarSlot?: React.ReactNode;
}

const STATUS_TAGS: { id: StatusFilter; label: string; dot: string }[] = [
  { id: 'all',  label: 'Tất cả',     dot: 'bg-muted-foreground/60' },
  { id: 'low',  label: 'Thiếu hàng', dot: 'bg-destructive' },
  { id: 'warn', label: 'Cảnh báo',   dot: 'bg-warning' },
  { id: 'ok',   label: 'Đủ hàng',    dot: 'bg-emerald-500' },
];

export default function InventoryNavigation({
  mainTab, subTab, statusFilter, statusCounts,
  canSeeRestaurant, canSeeFestival,
  countFor, sectionLogsCount,
  onMainTabChange, onSubTabChange, onStatusFilterChange,
  actionSlot, summarySlot, toolbarSlot,
}: Props) {
  const categoryTags: { id: SubTab; label: string; count: number }[] = [
    { id: 'food',      label: 'Thực phẩm',      count: countFor(mainTab, 'food') },
    { id: 'equipment', label: 'Trang thiết bị', count: countFor(mainTab, 'equipment') },
    { id: 'history',   label: 'Lịch sử',        count: sectionLogsCount },
  ];

  return (
    <>
      {canSeeRestaurant && canSeeFestival && (
        <ToggleGroup
          type="single"
          value={mainTab}
          onValueChange={(val) => {
            if (val) onMainTabChange(val as MainTab);
          }}
          className="w-full bg-muted/40 p-1 rounded-xl border flex"
          aria-label="Khu vực kho"
        >
          <ToggleGroupItem value="restaurant" className="flex-1 gap-1.5 text-xs h-9 rounded-lg font-semibold">
            <Store size={14} />Nhà hàng
          </ToggleGroupItem>
          <ToggleGroupItem value="festival" className="flex-1 gap-1.5 text-xs h-9 rounded-lg font-semibold">
            <Tent size={14} />Festival
          </ToggleGroupItem>
        </ToggleGroup>
      )}

      <ToggleGroup
        type="single"
        value={subTab}
        onValueChange={(val) => {
          if (val) onSubTabChange(val as SubTab);
        }}
        className="justify-start gap-1 bg-muted/40 p-1 rounded-xl w-max border flex overflow-x-auto scrollbar-hide"
        aria-label="Loại mặt hàng"
      >
        {categoryTags.map(({ id, label, count }) => (
          <ToggleGroupItem key={id} value={id} className="shrink-0 rounded-lg text-xs font-semibold px-3 py-1.5 h-8">
            {label}
            <span className="ml-1 font-bold tabular-nums opacity-70">{count}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {summarySlot}

      {toolbarSlot}

      {subTab !== 'history' && (
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={statusFilter}
            onValueChange={(val) => {
              if (val) onStatusFilterChange(val as StatusFilter);
            }}
            className="justify-start gap-1 bg-muted/40 p-1 rounded-xl w-max border flex overflow-x-auto scrollbar-hide min-w-0 flex-1"
            aria-label="Lọc theo trạng thái"
          >
            {STATUS_TAGS.map(({ id, label, dot }) => (
              <ToggleGroupItem key={id} value={id} className="shrink-0 rounded-lg text-xs font-semibold px-3 py-1.5 h-8 gap-1.5">
                <span className={`size-2 shrink-0 rounded-full ${dot}`} />
                {label}
                <span className="ml-0.5 font-bold tabular-nums opacity-70">{statusCounts[id]}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {actionSlot && <div className="shrink-0">{actionSlot}</div>}
        </div>
      )}
    </>
  );
}
