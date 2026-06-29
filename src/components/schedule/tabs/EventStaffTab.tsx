import { useState } from 'react';
import { UserMinus, UserPlus, Check } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '../../../context/AppContext';
import { useStaffQuery } from '../../../hooks/queries/useStaffQuery';
import { useAddStaffToEvent } from '../../../hooks/queries/mutations/useAddStaffToEvent';
import { useRemoveStaffFromEvent } from '../../../hooks/queries/mutations/useRemoveStaffFromEvent';
import type { FestivalEvent } from '../../../types';

interface Props {
  event: FestivalEvent;
}

export default function EventStaffTab({ event }: Props) {
  const { currentUser } = useApp();
  const { data: staff = [] } = useStaffQuery();
  const addStaffToEventMutation = useAddStaffToEvent();
  const removeStaffFromEventMutation = useRemoveStaffFromEvent();

  const isAdmin = currentUser?.role === 'admin';
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const assignedIds = new Set(event.staff.map(s => s.id));
  const availableStaff = staff.filter(s => !assignedIds.has(s.id));

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleConfirmAdd = () => {
    staff
      .filter(s => selected.has(s.id))
      .forEach(s => addStaffToEventMutation.mutate({ eventId: event.id, staffRef: { id: s.id, name: s.name, city: s.city } }));
    setSelected(new Set());
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{event.staff.length} nhân viên được phân công</p>
        {isAdmin && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => { setShowAdd(!showAdd); setSelected(new Set()); }}
            className="h-auto min-w-0 p-0 flex items-center gap-1 text-accent hover:text-accent/90 hover:bg-transparent text-sm font-semibold"
          >
            <UserPlus size={16} />
            Thêm
          </Button>
        )}
      </div>

      {/* Multi-select staff panel */}
      {showAdd && isAdmin && (
        <Card className="p-3 space-y-2 border shadow-sm bg-surface">
          <p className="text-xs font-semibold text-foreground/80">Chọn nhân viên để thêm</p>
          {availableStaff.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 text-center">Tất cả nhân viên đã được phân công</p>
          ) : (
            <div className="space-y-1">
              {availableStaff.map(s => (
                <Button
                  type="button"
                  key={s.id}
                  variant={selected.has(s.id) ? "secondary" : "outline"}
                  onClick={() => toggleSelect(s.id)}
                  className={`w-full justify-between rounded-xl px-3 py-2 text-sm font-semibold border h-9 ${
                    selected.has(s.id)
                      ? 'bg-accent/10 text-accent border-accent/30 hover:bg-accent/15 hover:text-accent'
                      : 'hover:border-accent/30'
                  }`}
                >
                  <span>{s.name}{s.city ? ` — ${s.city}` : ''}</span>
                  {selected.has(s.id) && <Check size={15} className="shrink-0" />}
                </Button>
              ))}
              <Button
                type="button"
                onClick={handleConfirmAdd}
                disabled={selected.size === 0}
                className="w-full h-9 mt-2 text-sm font-semibold rounded-xl"
              >
                Thêm {selected.size > 0 ? `${selected.size} nhân viên` : ''}
              </Button>
            </div>
          )}
        </Card>
      )}

      {event.staff.length === 0 ? (
        <EmptyState icon={<UserPlus size={24} />} title="Chưa có nhân viên được phân công" />
      ) : (
        <div className="space-y-2">
          {event.staff.map(s => (
            <Card key={s.id} className="p-3 flex justify-between items-center border shadow-sm bg-surface">
              <div>
                <p className="font-semibold text-foreground text-sm">{s.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.city}</p>
              </div>
              {isAdmin && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeStaffFromEventMutation.mutate({ eventId: event.id, staffId: s.id })}
                  aria-label="Gỡ nhân viên"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-lg transition-colors flex items-center justify-center"
                >
                  <UserMinus size={16} />
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
