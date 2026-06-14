import { motion } from 'framer-motion';
import { Package, AlertTriangle, TrendingUp, Check } from 'lucide-react';
import { Card } from '@heroui/react';
import { animations } from '../../lib/animations';
import type { InventoryItem } from '../../types';

interface Props {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
}

export default function InventoryItemRow({ item, onEdit }: Props) {
  const isLow  = item.current < item.threshold;
  const isWarn = !isLow && item.threshold > 0 && item.current < item.threshold * 1.5;

  const status = isLow
    ? { icon: AlertTriangle, box: 'bg-danger/10 border-danger/20 text-danger', sub: 'text-danger', border: 'border-danger/15', glow: '0 0 14px 2px rgba(239,68,68,0.10)' }
    : isWarn
    ? { icon: TrendingUp, box: 'bg-warning/10 border-warning/20 text-warning', sub: 'text-warning', border: 'border-warning/15', glow: 'none' }
    : { icon: Check, box: 'bg-success/10 border-success/20 text-success', sub: 'text-muted', border: '', glow: 'none' };

  const StatusIcon = isLow || isWarn ? status.icon : Package;

  return (
    <motion.div {...animations.press}>
      <Card
        className={`!p-0 cursor-pointer transition-all ${status.border}`}
        style={{ boxShadow: status.glow }}
        onClick={() => onEdit(item)}
      >
        <div className="flex items-center gap-2.5 p-2.5">
          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${status.box}`}>
            <StatusIcon size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate ${isLow ? 'text-danger' : 'text-foreground'}`}>
              {item.name}
            </p>
            <p className={`text-xs truncate ${status.sub}`}>
              Còn <span className="font-bold">{item.current}</span> {item.unit}
              {item.threshold > 0 && <span className="text-muted"> / Ngưỡng {item.threshold}</span>}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
