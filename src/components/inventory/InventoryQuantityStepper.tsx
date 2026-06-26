import { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@heroui/react';
import { useApp } from '../../context/AppContext';
import { useSetInventoryItem } from '../../hooks/queries/mutations/useSetInventoryItem';
import { useAddInventoryLog } from '../../hooks/queries/mutations/useAddInventoryLog';
import type { InventoryItem } from '../../types';

interface Props {
  item: InventoryItem;
  /** Ẩn đơn vị cạnh số (khi đơn vị đã có cột riêng, vd. table desktop) */
  hideUnit?: boolean;
}

export default function InventoryQuantityStepper({ item, hideUnit }: Props) {
  const { currentUser } = useApp();
  const setMutation = useSetInventoryItem();
  const addLogMutation = useAddInventoryLog();

  const [qty, setQty] = useState(item.current);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setQty(item.current);
  }, [item.current]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

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
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
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
        {!hideUnit && <span className="text-xs text-muted"> {item.unit}</span>}
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
  );
}
