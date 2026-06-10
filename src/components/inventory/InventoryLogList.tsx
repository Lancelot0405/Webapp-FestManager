import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
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
        <h2 className="text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide">
          Lịch sử ({filtered.length})
        </h2>
        {filtered.length > COLLAPSED_COUNT && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-brand-500 hover:text-brand-700 font-semibold transition-colors"
          >
            {expanded ? 'Thu gọn' : 'Xem tất cả'}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[140px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm mặt hàng..."
            value={itemSearch}
            onChange={e => setItemSearch(e.target.value)}
            className="w-full pl-7 pr-2 py-2 border border-brand-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--card-bg)] text-[var(--text-primary)] rounded-xl text-xs focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all placeholder:text-[var(--text-muted)]"
          />
        </div>
        <select
          value={festivalFilter}
          onChange={e => setFestivalFilter(e.target.value)}
          className="border border-brand-200 dark:border-[var(--border-color)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-500 bg-white dark:bg-[var(--card-bg)] text-[var(--text-primary)] transition-all"
        >
          <option value="">Tất cả sự kiện</option>
          {festivalNames.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>

      {/* Log list */}
      {filtered.length === 0 ? (
        <p className="text-xs text-brand-300 dark:text-brand-600 text-center py-4">Không có bản ghi nào</p>
      ) : (
        <div className="space-y-2">
          {displayed.map(log => (
            <div key={log.id} className="bg-[var(--card-bg)] rounded-xl p-3 border border-[var(--border-color)] shadow-card">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{log.itemName}</p>
                  <p className="text-xs text-brand-400 truncate">{log.festivalName} · {log.submittedBy}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-brand-600 dark:text-brand-400">{log.qty} {log.unit}</p>
                  <p className="text-xs text-brand-300 dark:text-brand-500">{log.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!expanded && filtered.length > COLLAPSED_COUNT && (
        <p className="text-xs text-brand-300 dark:text-brand-500 text-center">
          Hiển thị {COLLAPSED_COUNT}/{filtered.length} bản ghi
        </p>
      )}
    </div>
  );
}
