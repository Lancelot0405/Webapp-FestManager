import type { EventStatus } from '../types';

function parseDDMMYYYY(d: string): Date {
  if (!d) return new Date(NaN);
  const [dd, mm, yyyy] = d.split('-');
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
}

/**
 * Compute the effective status of an event based on its start/end dates.
 * - > 14 days until start → "Lên kế hoạch"
 * - ≤ 7 days until start → "Sắp tới"
 * - 8–14 days until start → "Lên kế hoạch"
 * - During event (start ≤ today ≤ end) → "Đang diễn ra"
 * - After end → "Đã hoàn thành"
 */
export function computeEventStatus(startDate: string, endDate?: string): EventStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = parseDDMMYYYY(startDate);
  const end = endDate ? parseDDMMYYYY(endDate) : start;

  if (isNaN(start.getTime())) return 'Lên kế hoạch';

  const todayTime = today.getTime();
  const endTime = end.getTime();
  const startTime = start.getTime();

  if (todayTime > endTime) return 'Đã hoàn thành';
  if (todayTime >= startTime) return 'Đang diễn ra';

  const daysUntilStart = Math.ceil((startTime - todayTime) / (1000 * 60 * 60 * 24));
  if (daysUntilStart <= 7) return 'Sắp tới';
  return 'Lên kế hoạch';
}
