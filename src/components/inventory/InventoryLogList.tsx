import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
            type="button"
            variant="ghost"
            onClick={() => setExpanded(v => !v)}
            className="h-auto min-w-0 p-0 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent font-semibold transition-colors"
          >
            {expanded ? 'Thu gọn' : 'Xem tất cả'}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm mặt hàng..."
            value={itemSearch}
            onChange={(e) => setItemSearch(e.target.value)}
            className="pl-9 h-9"
            aria-label="Tìm mặt hàng"
          />
        </div>
        <div className="min-w-[150px]">
          <Select
            value={festivalFilter || '__all__'}
            onValueChange={(val) => setFestivalFilter(val === '__all__' || !val ? '' : val)}
          >
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder="Chọn sự kiện" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tất cả sự kiện</SelectItem>
              {festivalNames.map(name => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Log list */}
      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4 bg-surface border border-dashed border-border rounded-xl">Không có bản ghi nào</p>
      ) : (
        <div className="space-y-2">
          {displayed.map(log => (
            <div key={log.id} className="bg-surface border border-border rounded-xl shadow-sm p-3">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{log.itemName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.festivalName} · {log.submittedBy}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-accent">{log.qty} {log.unit}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{log.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!expanded && filtered.length > COLLAPSED_COUNT && (
        <p className="text-xs text-muted-foreground text-center">
          Hiển thị {COLLAPSED_COUNT}/{filtered.length} bản ghi
        </p>
      )}
    </div>
  );
}
