import { useState } from 'react';
import { Button } from '@heroui/react';
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
      <div className="flex items-center justify-end">
        <FinanceExport />
      </div>

      {allMonths.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-x-visible">
          {(['all', ...allMonths] as string[]).map(m => (
            <Button
              key={m}
              variant="ghost"
              onPress={() => setSelectedMonth(m)}
              className={`h-auto min-w-0 shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedMonth === m
                  ? 'bg-[var(--primary)] text-[var(--background)]'
                  : 'bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {m === 'all' ? 'Tất cả' : m}
            </Button>
          ))}
        </div>
      )}

      <FinanceSummaryCards filteredEvents={filteredEvents} />

      <ExpenseList filteredEvents={filteredEvents} />

      <div>
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Theo sự kiện</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredEvents.map(event => (
            <EventFinanceCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
}
