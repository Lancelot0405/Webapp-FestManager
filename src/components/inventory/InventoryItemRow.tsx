import { motion } from 'framer-motion';
import { ChevronRight, AlertTriangle, TrendingUp, Check } from 'lucide-react';
import { Button, Card, Chip, ProgressBar } from '@heroui/react';
import { animations } from '../../lib/animations';
import type { InventoryItem } from '../../types';

interface Props {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
}

export default function InventoryItemRow({ item, onEdit }: Props) {
  const isLow  = item.current < item.threshold;
  const isWarn = !isLow && item.threshold > 0 && item.current < item.threshold * 1.5;

  const target = item.threshold > 0 ? item.threshold * 2 : item.current || 1;
  const pct = Math.max(6, Math.min(100, Math.round((item.current / target) * 100)));

  const status = isLow
    ? { label: 'Sắp hết', color: 'danger' as const, icon: AlertTriangle, text: 'text-danger', fill: 'bg-danger' }
    : isWarn
    ? { label: 'Cần chú ý', color: 'warning' as const, icon: TrendingUp, text: 'text-warning', fill: 'bg-warning' }
    : { label: 'Còn đủ', color: 'success' as const, icon: Check, text: 'text-success', fill: 'bg-success' };

  const StatusIcon = status.icon;

  return (
    <motion.div {...animations.press}>
      <Card
        className={`group overflow-hidden transition-all cursor-pointer p-0 ${
          isLow  ? 'border-danger/30 bg-danger/5' :
          isWarn ? 'border-warning/30 bg-warning/5' : ''
        }`}
      >
        <Button
          onPress={() => onEdit(item)}
          variant="ghost"
          aria-label={`Chỉnh sửa ${item.name}`}
          className="card-btn w-full flex flex-col items-stretch gap-2.5 px-4 py-3 text-left h-auto rounded-none hover:bg-default/40 transition-all"
        >
          <div className="flex items-start justify-between gap-2">
            <p className={`font-semibold text-sm leading-tight min-w-0 truncate ${isLow ? 'text-danger' : 'text-foreground'}`}>
              {item.name}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              <Chip size="sm" variant="soft" color={status.color} className="text-[10px] font-bold tracking-wide gap-0.5">
                <StatusIcon size={11} />
                {status.label}
              </Chip>
              <ChevronRight
                size={15}
                className="text-muted opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-150"
              />
            </div>
          </div>

          <div className="flex items-end justify-between gap-2">
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black tabular-nums leading-none ${status.text}`}>
                {item.current}
              </span>
              <span className="text-xs text-muted">{item.unit}</span>
            </div>
            {item.threshold > 0 && (
              <span className="text-[11px] text-muted">
                Ngưỡng <span className="font-semibold text-foreground/70">{item.threshold}</span>
              </span>
            )}
          </div>

          <ProgressBar value={pct} aria-label={`Tồn kho ${item.name}`} size="sm">
            <ProgressBar.Track className="bg-default/60 border border-separator">
              <ProgressBar.Fill className={status.fill} />
            </ProgressBar.Track>
          </ProgressBar>
        </Button>
      </Card>
    </motion.div>
  );
}
