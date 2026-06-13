import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@heroui/react';
import type { InventoryItem } from '../../types';

interface Props {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
}

function itemCls(low: boolean, warn: boolean) {
  return low  ? 'bg-[var(--danger)]/5 border border-[var(--danger)]/30 backdrop-blur-[var(--glass-blur)]' :
         warn ? 'bg-indigo-500/5 border border-indigo-500/30 backdrop-blur-[var(--glass-blur)]' :
                'glass-card';
}

export default function InventoryItemRow({ item, onEdit }: Props) {
  const isLow  = item.current < item.threshold;
  const isWarn = !isLow && item.threshold > 0 && item.current < item.threshold * 1.5;

  return (
    <div className={`group rounded-2xl overflow-hidden transition-all cursor-pointer ${itemCls(isLow, isWarn)}`}>
      <Button
        onPress={() => onEdit(item)}
        variant="ghost"
        aria-label={`Chỉnh sửa ${item.name}`}
        className="w-full flex items-center justify-between px-4 py-3 text-left h-auto rounded-none hover:bg-[var(--glass-bg)] active:scale-[0.99] transition-all"
      >
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${isLow ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'}`}>
            {item.name}
          </p>
          {isLow  && <p className="text-xs text-[var(--danger)] font-medium">⚠ Sắp hết hàng!</p>}
          {isWarn && <p className="text-xs text-indigo-400 font-medium">Sắp tới mức cảnh báo</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className={`text-sm font-black ${isLow ? 'text-[var(--danger)]' : isWarn ? 'text-indigo-400' : 'text-[var(--primary)]'}`}>
            {item.current}
          </span>
          <span className="text-xs text-[var(--text-muted)]">{item.unit}</span>
          <ChevronDown size={14} className="text-[var(--text-muted)] md:hidden" />
          <ChevronRight
            size={14}
            className="hidden md:block text-[var(--text-muted)] opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150"
          />
        </div>
      </Button>
    </div>
  );
}
