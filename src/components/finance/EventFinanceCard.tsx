import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useUpdateEvent } from '../../hooks/queries/mutations/useUpdateEvent';
import StatusBadge from '../shared/StatusBadge';
import { cn } from '@/lib/utils';
import type { FestivalEvent } from '../../types';

function BarRow({ label, value, maxVal, color }: {
  label: string; value: number; maxVal: number; color: string;
}) {
  const pct = maxVal > 0 ? Math.round((value / maxVal) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted w-20 shrink-0">{label}</span>
      <div className="flex-1 relative w-full h-2 bg-muted/60 rounded-full overflow-hidden border border-border">
        <div
          className={cn("h-full transition-all rounded-full", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-foreground/80 w-14 text-right shrink-0">
        {value.toLocaleString('fr-FR')}€
      </span>
    </div>
  );
}

interface Props {
  event: FestivalEvent;
}

export default function EventFinanceCard({ event }: Props) {
  const navigate = useNavigate();
  const updateEventMutation = useUpdateEvent();

  const [isEditing, setIsEditing] = useState(false);
  const [editIncome, setEditIncome] = useState(0);
  const [editRent, setEditRent] = useState(0);
  const [editIngredients, setEditIngredients] = useState(0);
  const [editTransport, setEditTransport] = useState(0);
  const [editStaff, setEditStaff] = useState(0);

  const startEditing = () => {
    setEditIncome(event.financials.income);
    setEditRent(event.financials.expenses.rent ?? 0);
    setEditIngredients(event.financials.expenses.ingredients ?? 0);
    setEditTransport(event.financials.expenses.transport ?? 0);
    setEditStaff(event.financials.expenses.staff ?? 0);
    setIsEditing(true);
  };

  const saveEditing = () => {
    updateEventMutation.mutate({
      ...event,
      financials: {
        income: editIncome,
        expenses: {
          ...event.financials.expenses,
          rent: editRent,
          ingredients: editIngredients,
          transport: editTransport,
          staff: editStaff,
        },
      },
    });
    setIsEditing(false);
  };

  const fixedExp = Object.values(event.financials.expenses).reduce<number>((s, v) => s + (v ?? 0), 0);
  const approvedReceiptsForEvent = event.receipts
    .filter(r => r.status === 'approved')
    .reduce((s, r) => s + r.amount, 0);
  const expTotal = fixedExp + approvedReceiptsForEvent;
  const profit = event.financials.income - expTotal;
  const maxVal = Math.max(event.financials.income, expTotal, 1);

  return (
    <Card className="p-4 border">
      <div className="flex justify-between items-start mb-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate('/schedule/' + event.id)}
          className="h-auto min-w-0 flex-1 justify-start p-2 -m-2 rounded-xl text-left hover:bg-muted/40"
        >
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{event.name}</p>
            <p className="text-xs text-muted mt-0.5">{event.date}</p>
          </div>
        </Button>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <StatusBadge status={event.status} />
          <Button
            type="button"
            onClick={() => isEditing ? setIsEditing(false) : startEditing()}
            variant="ghost"
            className="rounded-lg text-muted hover:text-foreground h-8 w-8 p-0 flex items-center justify-center"
            aria-label="Sửa"
          >
            <Pencil size={14} />
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2 mt-2">
          <div className="grid grid-cols-2 gap-2">
            {([
              { label: 'Doanh thu (€)',   val: editIncome,      set: setEditIncome      },
              { label: 'Booth (€)',        val: editRent,        set: setEditRent        },
              { label: 'Nguyên liệu (€)', val: editIngredients, set: setEditIngredients },
              { label: 'Vận chuyển (€)',  val: editTransport,   set: setEditTransport   },
              { label: 'Lương NV (€)',    val: editStaff,       set: setEditStaff       },
            ] as { label: string; val: number; set: (v: number) => void }[]).map(({ label, val, set }) => (
              <div key={label} className="w-full flex flex-col gap-1">
                <Label className="text-xs font-medium text-foreground/80">{label}</Label>
                <Input
                  type="number"
                  value={String(val)}
                  onChange={(e) => set(Number(e.target.value))}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Button type="button" onClick={saveEditing} className="flex-1 rounded-xl">Lưu</Button>
            <Button type="button" onClick={() => setIsEditing(false)} variant="ghost" className="flex-1 rounded-xl">Hủy</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <BarRow label="Doanh thu" value={event.financials.income} maxVal={maxVal} color="bg-success" />
            <BarRow label="Chi phí"   value={expTotal}                maxVal={maxVal} color="bg-danger"  />
          </div>
          {approvedReceiptsForEvent > 0 && (
            <p className="text-xs text-muted mt-1">
              Bao gồm {approvedReceiptsForEvent.toLocaleString('fr-FR')}€ chi phí nhân viên
            </p>
          )}
          <div className="mt-3 flex justify-between text-xs font-semibold">
            <span className="text-muted">Lợi nhuận</span>
            <span className={profit >= 0 ? 'text-success' : 'text-danger'}>
              {profit >= 0 ? '+' : ''}{profit.toLocaleString('fr-FR')}€
            </span>
          </div>
        </>
      )}
    </Card>
  );
}
