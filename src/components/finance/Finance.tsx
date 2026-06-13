import { useState } from 'react';
import { ToggleButtonGroup, ToggleButton } from '@heroui/react';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import FinanceSummaryCards from './FinanceSummaryCards';
import ExpenseList from './ExpenseList';
import EventFinanceCard from './EventFinanceCard';
import FinanceExport from './FinanceExport';

export default function Finance() {
  const { data: events = [] } = useEventsQuery();
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const allMonths: string[] = [];
  events.forEach(e => {
    const parts = e.date.split('-');
    if (parts.length === 3) {
      const month = `${parts[1]}/${parts[2]}`;
      if (!allMonths.includes(month)) allMonths.push(month);
    }
  });
  allMonths.sort();

  const filteredEvents = selectedMonth === 'all'
    ? events
    : events.filter(e => {
        const parts = e.date.split('-');
        return parts.length === 3 && `${parts[1]}/${parts[2]}` === selectedMonth;
      });

  return (
    <div className="space-y-6 pb-20">
      <div className="fixed bottom-24 right-4 md:bottom-8 z-30">
        <FinanceExport />
      </div>

      {allMonths.length > 0 && (
        <div className="overflow-x-auto pb-1">
          <ToggleButtonGroup
            selectionMode="single"
            disallowEmptySelection
            isDetached
            size="sm"
            selectedKeys={new Set([selectedMonth])}
            onSelectionChange={(keys) => {
              const next = [...keys][0];
              if (next !== undefined) setSelectedMonth(String(next));
            }}
            className="flex-nowrap"
          >
            {(['all', ...allMonths] as string[]).map(m => (
              <ToggleButton key={m} id={m} className="shrink-0 rounded-full">
                {m === 'all' ? 'Tất cả' : m}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
      )}

      <FinanceSummaryCards filteredEvents={filteredEvents} />

      <ExpenseList filteredEvents={filteredEvents} />

      <div>
        <h2 className="text-sm font-semibold text-foreground/80 mb-3">Theo sự kiện</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredEvents.map(event => (
            <EventFinanceCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
}
