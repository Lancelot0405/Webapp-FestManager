import { useState, useMemo } from 'react';
import { Button, SearchField, Select, ListBox } from '@heroui/react';
import type { InventoryLogEntry } from '../../types';

interface Props { logs: InventoryLogEntry[] }

const COLLAPSED_COUNT = 5;

export default function InventoryLogList({ logs }: Props) {
  const [expanded,       setExpanded]       = useState(false);
  const [itemSearch,     setItemSearch]     = useState('');
  const [festivalFilter, setFestivalFilter] = useState('');

  const festivalNames = useMemo(() =>
    Array.from(new Set(logs.map(l => l.festivalName).filter(Boolean))).sort()
  , [logs]);

  const filtered = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    return logs.filter(l => {
      const matchItem = !q || l.itemName.toLowerCase().includes(q);
      const matchFest = !festivalFilter || l.festivalName === festivalFilter;
      return matchItem && matchFest;
    });
  }, [logs, itemSearch, festivalFilter]);

  const displayed = expanded ? filtered : filtered.slice(0, COLLAPSED_COUNT);

  if (logs.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground/80 uppercase tracking-wide">
          Lịch sử ({filtered.length})
        </h2>
        {filtered.length > COLLAPSED_COUNT && (
          <Button
            variant="ghost"
            onPress={() => setExpanded(v => !v)}
            className="h-auto min-w-0 p-0 text-xs text-muted hover:text-foreground font-semibold transition-colors"
          >
            {expanded ? 'Thu gọn' : 'Xem tất cả'}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <SearchField value={itemSearch} onChange={setItemSearch} className="flex-1 min-w-[140px]" aria-label="Tìm mặt hàng">
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Tìm mặt hàng..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <Select value={festivalFilter || '__all__'} onChange={(key) => setFestivalFilter(key === '__all__' || key == null ? '' : String(key))} className="min-w-[150px] flex flex-col gap-1">
          <Select.Trigger className="h-9 text-sm"><Select.Value /><Select.Indicator /></Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="__all__" textValue="Tất cả sự kiện">Tất cả sự kiện<ListBox.ItemIndicator /></ListBox.Item>
              {festivalNames.map(name => (
                <ListBox.Item key={name} id={name} textValue={name}>{name}<ListBox.ItemIndicator /></ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      {/* Log list */}
      {filtered.length === 0 ? (
        <p className="text-xs text-muted text-center py-4">Không có bản ghi nào</p>
      ) : (
        <div className="space-y-2">
          {displayed.map(log => (
            <div key={log.id} className="bg-surface border border-separator rounded-xl shadow-sm p-3">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{log.itemName}</p>
                  <p className="text-xs text-muted truncate">{log.festivalName} · {log.submittedBy}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-accent">{log.qty} {log.unit}</p>
                  <p className="text-xs text-muted">{log.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!expanded && filtered.length > COLLAPSED_COUNT && (
        <p className="text-xs text-muted text-center">
          Hiển thị {COLLAPSED_COUNT}/{filtered.length} bản ghi
        </p>
      )}
    </div>
  );
}
