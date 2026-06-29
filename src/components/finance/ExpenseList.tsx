import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUpdateExpenseStatus } from '../../hooks/queries/mutations/useUpdateExpenseStatus';
import type { FestivalEvent } from '../../types';

interface Props {
  filteredEvents: FestivalEvent[];
}

export default function ExpenseList({ filteredEvents }: Props) {
  const updateExpenseStatusMutation = useUpdateExpenseStatus();

  const pendingReceipts = filteredEvents.flatMap(e =>
    e.receipts
      .filter(r => r.status === 'pending')
      .map(r => ({ ...r, eventName: e.name, eventId: e.id }))
  );

  return (
    <Card className="p-4 border">
      <h2 className="text-sm font-semibold text-foreground/80 mb-3">Chi phí nhân viên chờ duyệt</h2>
      {pendingReceipts.length === 0 ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">Không có chi phí chờ duyệt ✓</p>
      ) : (
        <div className="relative w-full overflow-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="text-xs font-semibold text-muted-foreground px-3 py-2 bg-muted/50 dark:bg-default-100/20">Nhân viên</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground px-3 py-2 bg-muted/50 dark:bg-default-100/20">Loại</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground px-3 py-2 text-right bg-muted/50 dark:bg-default-100/20">Số tiền</TableHead>
                <TableHead className="hidden md:table-cell text-xs font-semibold text-muted-foreground px-3 py-2 bg-muted/50 dark:bg-default-100/20">Ngày</TableHead>
                <TableHead className="hidden lg:table-cell text-xs font-semibold text-muted-foreground px-3 py-2 bg-muted/50 dark:bg-default-100/20">Sự kiện</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground px-3 py-2 text-right bg-muted/50 dark:bg-default-100/20">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingReceipts.map(r => (
                <TableRow key={`${r.eventId}-${r.id}`} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <TableCell className="py-2.5 px-3">
                    <p className="font-medium text-foreground truncate max-w-[120px]">{r.staffName}</p>
                  </TableCell>
                  <TableCell className="py-2.5 px-3 text-foreground/80">{r.type}</TableCell>
                  <TableCell className="py-2.5 px-3 text-right font-semibold text-foreground whitespace-nowrap">
                    {r.amount.toLocaleString('fr-FR')}€
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-2.5 px-3 text-muted-foreground whitespace-nowrap">{r.date}</TableCell>
                  <TableCell className="hidden lg:table-cell py-2.5 px-3 text-accent/70 truncate max-w-[160px]">{r.eventName}</TableCell>
                  <TableCell className="py-2.5 px-3">
                    <div className="flex gap-1.5 justify-end">
                      <Button
                        type="button"
                        onClick={() => updateExpenseStatusMutation.mutate({ eventId: r.eventId, expenseId: r.id, status: 'approved' })}
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/20 px-2.5 h-8 font-medium"
                      >
                        <Check size={12} /> Duyệt
                      </Button>
                      <Button
                        type="button"
                        onClick={() => updateExpenseStatusMutation.mutate({ eventId: r.eventId, expenseId: r.id, status: 'rejected' })}
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-0.5 rounded-lg text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 px-2.5 h-8 font-medium"
                      >
                        <X size={12} /> Từ chối
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
