import { Store, Tent } from 'lucide-react';
import { ToggleButtonGroup, ToggleButton, TagGroup, Tag } from '@heroui/react';
import type { Key, Selection } from '@heroui/react';
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
  { id: 'all',  label: 'Tất cả',     dot: 'bg-muted' },
  { id: 'low',  label: 'Thiếu hàng', dot: 'bg-danger' },
  { id: 'warn', label: 'Cảnh báo',   dot: 'bg-warning' },
  { id: 'ok',   label: 'Đủ hàng',    dot: 'bg-success' },
];

// Lấy key đầu tiên của Selection; bỏ qua khi rỗng để luôn giữ 1 lựa chọn.
function firstKey(keys: Selection): Key | null {
  if (keys === 'all') return null;
  const arr = [...keys];
  return arr.length > 0 ? arr[0] : null;
}

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
        <ToggleButtonGroup
          selectionMode="single"
          disallowEmptySelection
          isDetached
          size="sm"
          selectedKeys={new Set([mainTab])}
          onSelectionChange={(keys) => {
            const k = firstKey(keys) as MainTab | null;
            if (k) onMainTabChange(k);
          }}
          className="w-full"
          aria-label="Khu vực kho"
        >
          <ToggleButton id="restaurant" className="flex-1 gap-1.5 text-xs">
            <Store size={14} />Nhà hàng
          </ToggleButton>
          <ToggleButton id="festival" className="flex-1 gap-1.5 text-xs">
            <Tent size={14} />Festival
          </ToggleButton>
        </ToggleButtonGroup>
      )}

      <TagGroup
        selectionMode="single"
        selectedKeys={new Set([subTab])}
        onSelectionChange={(keys) => {
          const k = firstKey(keys) as SubTab | null;
          if (k) onSubTabChange(k);
        }}
        aria-label="Loại mặt hàng"
      >
        <TagGroup.List className="flex-nowrap overflow-x-auto scrollbar-hide">
          {categoryTags.map(({ id, label, count }) => (
            <Tag key={id} id={id} textValue={label} className="shrink-0">
              {label}
              <span className="ml-1 font-bold tabular-nums opacity-70">{count}</span>
            </Tag>
          ))}
        </TagGroup.List>
      </TagGroup>

      {summarySlot}

      {toolbarSlot}

      {subTab !== 'history' && (
        <div className="flex items-center gap-2">
          <TagGroup
            selectionMode="single"
            selectedKeys={new Set([statusFilter])}
            onSelectionChange={(keys) => {
              const k = firstKey(keys) as StatusFilter | null;
              if (k) onStatusFilterChange(k);
            }}
            aria-label="Lọc theo trạng thái"
            className="min-w-0 flex-1"
          >
            <TagGroup.List className="flex-nowrap overflow-x-auto scrollbar-hide">
              {STATUS_TAGS.map(({ id, label, dot }) => (
                <Tag key={id} id={id} textValue={label} className="shrink-0">
                  <span className={`size-2 shrink-0 rounded-full ${dot}`} />
                  {label}
                  <span className="ml-0.5 font-bold tabular-nums opacity-70">{statusCounts[id]}</span>
                </Tag>
              ))}
            </TagGroup.List>
          </TagGroup>
          {actionSlot && <div className="shrink-0">{actionSlot}</div>}
        </div>
      )}
    </>
  );
}
