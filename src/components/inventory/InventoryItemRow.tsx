import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button, Card } from '@heroui/react';
import type { InventoryItem } from '../../types';

interface Props {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
}

export default function InventoryItemRow({ item, onEdit }: Props) {
  const isLow  = item.current < item.threshold;
  const isWarn = !isLow && item.threshold > 0 && item.current < item.threshold * 1.5;

  return (
    <Card
      className={`group overflow-hidden transition-all cursor-pointer ${
        isLow  ? 'border-danger/30 bg-danger/5' :
        isWarn ? 'border-accent/30 bg-accent/5' : ''
      }`}
    >
      <Button
        onPress={() => onEdit(item)}
        variant="ghost"
        aria-label={`Chỉnh sửa ${item.name}`}
        className="w-full flex items-center justify-between px-4 py-3 text-left h-auto rounded-none hover:bg-default/50 active:scale-[0.99] transition-all"
      >
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${isLow ? 'text-danger' : 'text-foreground'}`}>
            {item.name}
          </p>
          {isLow  && <p className="text-xs text-danger font-medium">⚠ Sắp hết hàng!</p>}
          {isWarn && <p className="text-xs text-accent font-medium">Sắp tới mức cảnh báo</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className={`text-sm font-black ${isLow ? 'text-danger' : isWarn ? 'text-accent' : 'text-accent'}`}>
            {item.current}
          </span>
          <span className="text-xs text-muted">{item.unit}</span>
          <ChevronDown size={14} className="text-muted md:hidden" />
          <ChevronRight
            size={14}
            className="hidden md:block text-muted opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150"
          />
        </div>
      </Button>
    </Card>
  );
}
