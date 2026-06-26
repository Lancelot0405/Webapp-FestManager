import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@heroui/react';
import { useApp } from '../../context/AppContext';
import { useSetInventoryItem } from '../../hooks/queries/mutations/useSetInventoryItem';
import { useAddInventoryLog } from '../../hooks/queries/mutations/useAddInventoryLog';
import { getItemStatus } from './useInventoryFilters';
import type { InventoryItem } from '../../types';

interface Props {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
}

const STATUS_DOT: Record<string, string> = {
  low:  'bg-danger',
  warn: 'bg-warning',
  ok:   'bg-success',
};

export default function InventoryItemRow({ item, onEdit }: Props) {
  const { currentUser } = useApp();
  const setMutation = useSetInventoryItem();
  const addLogMutation = useAddInventoryLog();

  const [qty, setQty] = useState(item.current);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setQty(item.current);
  }, [item.current]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const status = getItemStatus(item);
  const isLow = status === 'low';

  const commit = (next: number) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (next === item.current) return;
      setMutation.mutate({ itemId: item.id, qty: next });
      if (currentUser) {
        addLogMutation.mutate({
          id: Date.now(), itemId: item.id, itemName: item.name, qty: next, unit: item.unit,
          action: 'set', festivalId: null, festivalName: 'Kiểm kho tổng',
          timestamp: new Date().toLocaleString('vi-VN', { hour12: false }),
          submittedBy: currentUser.name,
        });
      }
    }, 600);
  };

  const step = (delta: number) => {
    setQty((prev) => {
      const next = Math.max(0, Math.round((prev + delta) * 100) / 100);
      commit(next);
      return next;
    });
  };

  return (
    <motion.div
      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer active:bg-foreground/[0.04] transition-colors"
      onClick={() => onEdit(item)}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[status]}`} />

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${isLow ? 'text-danger' : 'text-foreground'}`}>
          {item.name}
        </p>
        {item.threshold > 0 && (
          <p className="text-xs text-muted">Ngưỡng {item.threshold} {item.unit}</p>
        )}
      </div>

      <div
        className="flex items-center gap-1.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          isIconOnly
          size="sm"
          variant="secondary"
          aria-label="Giảm"
          isDisabled={qty <= 0}
          onPress={() => step(-1)}
        >
          <Minus size={14} />
        </Button>
        <div className="min-w-[3.5rem] text-center">
          <span className="text-sm font-bold tabular-nums text-foreground">{qty}</span>
          <span className="text-xs text-muted"> {item.unit}</span>
        </div>
        <Button
          isIconOnly
          size="sm"
          variant="secondary"
          aria-label="Tăng"
          onPress={() => step(1)}
        >
          <Plus size={14} />
        </Button>
      </div>
    </motion.div>
  );
}
