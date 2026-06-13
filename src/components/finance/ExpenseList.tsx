import { Check, X } from 'lucide-react';
import { Button, Card, Table } from '@heroui/react';
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
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-foreground/80 mb-3">Chi phí nhân viên chờ duyệt</h2>
      {pendingReceipts.length === 0 ? (
        <p className="text-sm text-success">Không có chi phí chờ duyệt ✓</p>
      ) : (
        <Table variant="secondary">
          <Table.ScrollContainer>
            <Table.Content aria-label="Chi phí nhân viên chờ duyệt">
              <Table.Header>
                <Table.Column isRowHeader className="text-xs font-semibold text-muted px-1 py-2">Nhân viên</Table.Column>
                <Table.Column className="text-xs font-semibold text-muted px-1 py-2">Loại</Table.Column>
                <Table.Column className="text-xs font-semibold text-muted px-1 py-2 text-right">Số tiền</Table.Column>
                <Table.Column className="hidden md:table-cell text-xs font-semibold text-muted px-1 py-2">Ngày</Table.Column>
                <Table.Column className="hidden lg:table-cell text-xs font-semibold text-muted px-1 py-2">Sự kiện</Table.Column>
                <Table.Column className="text-xs font-semibold text-muted px-1 py-2 text-right">Thao tác</Table.Column>
              </Table.Header>
              <Table.Body>
                {pendingReceipts.map(r => (
                  <Table.Row key={`${r.eventId}-${r.id}`} id={`${r.eventId}-${r.id}`}>
                    <Table.Cell className="py-2.5 px-1">
                      <p className="font-medium text-foreground truncate max-w-[120px]">{r.staffName}</p>
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-1 text-foreground/80">{r.type}</Table.Cell>
                    <Table.Cell className="py-2.5 px-1 text-right font-semibold text-foreground whitespace-nowrap">
                      {r.amount.toLocaleString('fr-FR')}€
                    </Table.Cell>
                    <Table.Cell className="hidden md:table-cell py-2.5 px-1 text-muted whitespace-nowrap">{r.date}</Table.Cell>
                    <Table.Cell className="hidden lg:table-cell py-2.5 px-1 text-accent/70 truncate max-w-[160px]">{r.eventName}</Table.Cell>
                    <Table.Cell className="py-2.5 px-1">
                      <div className="flex gap-1.5 justify-end">
                        <Button
                          onPress={() => updateExpenseStatusMutation.mutate({ eventId: r.eventId, expenseId: r.id, status: 'approved' })}
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-0.5 bg-success/10 hover:bg-success/20 text-success rounded-lg border border-success/20"
                        >
                          <Check size={12} /> Duyệt
                        </Button>
                        <Button
                          onPress={() => updateExpenseStatusMutation.mutate({ eventId: r.eventId, expenseId: r.id, status: 'rejected' })}
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-0.5 rounded-lg text-danger bg-[color-mix(in oklch, var(--danger) 15%, transparent)] hover:bg-danger/20 border border-danger/20"
                        >
                          <X size={12} /> Từ chối
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      )}
    </Card>
  );
}
