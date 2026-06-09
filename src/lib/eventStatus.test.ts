import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { computeEventStatus } from './eventStatus';

// Cố định "hôm nay" = 15-06-2026 để test xác định, không phụ thuộc ngày chạy.
const TODAY = new Date('2026-06-15T09:00:00');

function ddmmyyyy(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
}
function daysFromToday(n: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return ddmmyyyy(d);
}

describe('computeEventStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(TODAY);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('input rỗng/sai → "Lên kế hoạch"', () => {
    expect(computeEventStatus('')).toBe('Lên kế hoạch');
    expect(computeEventStatus('không-phải-ngày')).toBe('Lên kế hoạch');
  });

  it('cách hơn 14 ngày → "Lên kế hoạch"', () => {
    expect(computeEventStatus(daysFromToday(30))).toBe('Lên kế hoạch');
  });

  it('cách 8–14 ngày → "Lên kế hoạch"', () => {
    expect(computeEventStatus(daysFromToday(10))).toBe('Lên kế hoạch');
  });

  it('trong vòng 7 ngày tới → "Sắp tới"', () => {
    expect(computeEventStatus(daysFromToday(3))).toBe('Sắp tới');
    expect(computeEventStatus(daysFromToday(7))).toBe('Sắp tới');
  });

  it('hôm nay nằm trong khoảng diễn ra → "Đang diễn ra"', () => {
    expect(computeEventStatus(daysFromToday(-1), daysFromToday(1))).toBe('Đang diễn ra');
    expect(computeEventStatus(daysFromToday(0))).toBe('Đang diễn ra');
  });

  it('đã qua ngày kết thúc → "Đã hoàn thành"', () => {
    expect(computeEventStatus(daysFromToday(-10), daysFromToday(-5))).toBe('Đã hoàn thành');
    expect(computeEventStatus(daysFromToday(-3))).toBe('Đã hoàn thành');
  });
});
