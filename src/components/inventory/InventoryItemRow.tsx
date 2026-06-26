import { motion } from 'framer-motion';
import { getItemStatus } from './useInventoryFilters';
import InventoryQuantityStepper from './InventoryQuantityStepper';
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
  const status = getItemStatus(item);
  const isLow = status === 'low';

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

      <div className="shrink-0">
        <InventoryQuantityStepper item={item} />
      </div>
    </motion.div>
  );
}
