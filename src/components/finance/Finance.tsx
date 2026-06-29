import { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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
      <div className="flex items-center justify-between gap-3">
        <div className="overflow-x-auto pb-1 flex-1 scrollbar-hide">
          <ToggleGroup
            type="single"
            value={selectedMonth}
            onValueChange={(val) => {
              if (val) setSelectedMonth(val);
            }}
            className="justify-start gap-1 bg-muted/40 p-1 rounded-xl w-max border flex"
          >
            {(['all', ...allMonths] as string[]).map(m => (
              <ToggleGroupItem key={m} value={m} className="shrink-0 rounded-lg text-xs font-semibold px-3 py-1.5 h-8">
                {m === 'all' ? 'Tất cả' : m}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="shrink-0">
          <FinanceExport />
        </div>
      </div>

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
