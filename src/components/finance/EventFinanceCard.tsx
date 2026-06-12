import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { Button } from '@heroui/react';
import { Input } from '@/components/ui/input';
import StatusBadge from '../shared/StatusBadge';
import BarRow from './BarRow';
import type { FestivalEvent } from '../../types';
import { useUpdateEventMutation } from '../../hooks/queries/useMutations';

interface EventFinanceCardProps {
  event: FestivalEvent;
}

export default function EventFinanceCard({ event }: EventFinanceCardProps) {
  const navigate = useNavigate();
  const updateEventMutation = useUpdateEventMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [editIncome, setEditIncome] = useState(event.financials.income);
  const [editRent, setEditRent] = useState(event.financials.expenses.rent ?? 0);
  const [editIngredients, setEditIngredients] = useState(event.financials.expenses.ingredients ?? 0);
  const [editTransport, setEditTransport] = useState(event.financials.expenses.transport ?? 0);
  const [editStaff, setEditStaff] = useState(event.financials.expenses.staff ?? 0);

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
    }, {
      onSuccess: () => {
        setIsEditing(false);
      }
    });
  };

  const fixedExp = Object.values(event.financials.expenses).reduce<number>((s, v) => s + (v ?? 0), 0);
  const approvedReceiptsForEvent = event.receipts
    .filter(r => r.status === 'approved')
    .reduce((s, r) => s + r.amount, 0);
  const expTotal = fixedExp + approvedReceiptsForEvent;
  const profit = event.financials.income - expTotal;
  const maxVal = Math.max(event.financials.income, expTotal, 1);

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex justify-between items-start mb-3">
        <Button
          variant="ghost"
          onPress={() => navigate('/schedule/' + event.id)}
          className="h-auto min-w-0 flex-1 justify-start rounded-none p-0 text-left"
        >
          <div className="min-w-0">
            <p className="font-semibold text-[var(--text-primary)] truncate">{event.name}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{event.date}</p>
          </div>
        </Button>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <StatusBadge status={event.status} />
          <Button
            onPress={() => isEditing ? setIsEditing(false) : startEditing()}
            variant="ghost"
            isIconOnly
            size="sm"
            className="rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <Pencil size={14} />
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2 mt-2">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Doanh thu (€)', val: editIncome, set: setEditIncome },
              { label: 'Booth (€)',      val: editRent,   set: setEditRent },
              { label: 'Nguyên liệu (€)', val: editIngredients, set: setEditIngredients },
              { label: 'Vận chuyển (€)', val: editTransport,   set: setEditTransport },
              { label: 'Lương NV (€)',   val: editStaff,  set: setEditStaff },
            ].map(({ label, val, set }) => (
              <Input
                key={label}
                label={label}
                type="number"
                value={String(val)}
                onChange={value => set(Number(value))}
              />
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Button onPress={saveEditing} variant="primary" fullWidth isDisabled={updateEventMutation.isPending}>Lưu</Button>
            <Button onPress={() => setIsEditing(false)} variant="ghost" fullWidth>Hủy</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <BarRow label="Doanh thu" value={event.financials.income} maxVal={maxVal} color="bg-[var(--success)]" />
            <BarRow label="Chi phí"   value={expTotal}                maxVal={maxVal} color="bg-[var(--danger)]"  />
          </div>
          {approvedReceiptsForEvent > 0 && (
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Bao gồm {approvedReceiptsForEvent.toLocaleString('fr-FR')}€ chi phí nhân viên
            </p>
          )}
          <div className="mt-3 flex justify-between text-xs font-semibold">
            <span className="text-[var(--text-muted)]">Lợi nhuận</span>
            <span className={profit >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}>
              {profit >= 0 ? '+' : ''}{profit.toLocaleString('fr-FR')}€
            </span>
          </div>
        </>
      )}
    </div>
  );
}
