import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@heroui/react';
import { Input } from '@/components/shared/GlassInput';
import { Select } from '@/components/shared/GlassSelect';
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
        <Input
          type="text"
          placeholder="Tìm mặt hàng..."
          value={itemSearch}
          onChange={setItemSearch}
          startContent={<Search size={13} />}
          className="flex-1 min-w-[140px]"
        />
        <Select
          size="sm"
          className="min-w-[150px]"
          value={festivalFilter || '__all__'}
          onChange={(v) => setFestivalFilter(v === '__all__' ? '' : v)}
          options={[
            { value: '__all__', label: 'Tất cả sự kiện' },
            ...festivalNames.map(name => ({ value: name, label: name })),
          ]}
        />
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
