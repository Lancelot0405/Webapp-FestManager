import { Package, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Props {
  total: number;
  lowCount: number;
  itemLabel: string;
}

export default function InventorySummary({ total, lowCount, itemLabel }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Card className="flex flex-row items-center gap-2.5 px-3 py-2.5 border shadow-sm bg-surface">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Package size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-black leading-none tabular-nums text-foreground">{total}</p>
          <p className="text-[11px] text-muted-foreground truncate">Tổng {itemLabel}</p>
        </div>
      </Card>
      <Card className={`flex flex-row items-center gap-2.5 px-3 py-2.5 border shadow-sm bg-surface ${lowCount > 0 ? 'border-destructive/30 bg-destructive/5' : ''}`}>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${lowCount > 0 ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
          <AlertTriangle size={18} />
        </div>
        <div className="min-w-0">
          <p className={`text-lg font-black leading-none tabular-nums ${lowCount > 0 ? 'text-destructive' : 'text-foreground'}`}>{lowCount}</p>
          <p className="text-[11px] text-muted-foreground truncate">Sắp hết hàng</p>
        </div>
      </Card>
    </div>
  );
}
