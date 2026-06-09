import { describe, it, expect } from 'vitest';
import { toISODate, fromISODate } from './dateHelpers';

describe('toISODate (DD-MM-YYYY → YYYY-MM-DD)', () => {
  it('chuyển định dạng hiển thị sang ISO', () => {
    expect(toISODate('25-12-2026')).toBe('2026-12-25');
  });

  it('giữ nguyên nếu đã là ISO', () => {
    expect(toISODate('2026-12-25')).toBe('2026-12-25');
  });

  it('cắt phần thời gian khỏi ISO', () => {
    expect(toISODate('2026-12-25T10:30:00')).toBe('2026-12-25');
  });

  it('trả chuỗi rỗng cho input rỗng', () => {
    expect(toISODate('')).toBe('');
  });
});

describe('fromISODate (YYYY-MM-DD → DD-MM-YYYY)', () => {
  it('chuyển ISO sang định dạng hiển thị', () => {
    expect(fromISODate('2026-12-25')).toBe('25-12-2026');
  });

  it('giữ nguyên nếu đã là DD-MM-YYYY', () => {
    expect(fromISODate('25-12-2026')).toBe('25-12-2026');
  });

  it('cắt phần thời gian trước khi chuyển', () => {
    expect(fromISODate('2026-12-25T08:00:00')).toBe('25-12-2026');
  });

  it('trả chuỗi rỗng cho input rỗng', () => {
    expect(fromISODate('')).toBe('');
  });
});

describe('round-trip', () => {
  it('toISODate ∘ fromISODate giữ nguyên giá trị', () => {
    expect(fromISODate(toISODate('01-06-2026'))).toBe('01-06-2026');
    expect(toISODate(fromISODate('2026-06-01'))).toBe('2026-06-01');
  });
});
