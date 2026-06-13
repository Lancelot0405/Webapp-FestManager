import { useState } from 'react';
import { UserMinus, UserPlus, Check } from 'lucide-react';
import { Button } from '@heroui/react';
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
        <p className="text-sm text-[var(--text-muted)]">{event.staff.length} nhân viên được phân công</p>
        {isAdmin && (
          <Button
            variant="ghost"
            onPress={() => { setShowAdd(!showAdd); setSelected(new Set()); }}
            className="h-auto min-w-0 p-0 flex items-center gap-1 text-[var(--primary)] text-sm font-semibold"
          >
            <UserPlus size={16} />
            Thêm
          </Button>
        )}
      </div>

      {/* Multi-select staff panel */}
      {showAdd && isAdmin && (
        <div className="glass-card rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">Chọn nhân viên để thêm</p>
          {availableStaff.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-2 text-center">Tất cả nhân viên đã được phân công</p>
          ) : (
            <>
              {availableStaff.map(s => (
                <Button
                  key={s.id}
                  variant="ghost"
                  onPress={() => toggleSelect(s.id)}
                  className={`w-full h-auto flex items-center justify-between text-left rounded-xl px-3 py-2 text-sm transition-all border ${
                    selected.has(s.id)
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30'
                      : 'glass-card text-[var(--text-primary)] border-[var(--glass-border)] hover:border-[var(--primary)]/30'
                  }`}
                >
                  <span>{s.name}{s.city ? ` — ${s.city}` : ''}</span>
                  {selected.has(s.id) && <Check size={15} className="shrink-0" />}
                </Button>
              ))}
              <Button
                onPress={handleConfirmAdd}
                isDisabled={selected.size === 0}
                className="w-full h-auto mt-1 bg-[var(--primary)] text-[var(--background)] disabled:opacity-40 text-sm font-semibold py-2 rounded-xl transition-opacity"
              >
                Thêm {selected.size > 0 ? `${selected.size} nhân viên` : ''}
              </Button>
            </>
          )}
        </div>
      )}

      {event.staff.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-8">Chưa có nhân viên được phân công</p>
      ) : (
        <div className="space-y-2">
          {event.staff.map(s => (
            <div
              key={s.id}
              className="glass-card rounded-xl p-3 flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-[var(--text-primary)] text-sm">{s.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{s.city}</p>
              </div>
              {isAdmin && (
                <Button
                  isIconOnly
                  variant="ghost"
                  onPress={() => removeStaffFromEventMutation.mutate({ eventId: event.id, staffId: s.id })}
                  aria-label="Gỡ nhân viên"
                  className="h-auto min-w-0 p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
                >
                  <UserMinus size={16} />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
