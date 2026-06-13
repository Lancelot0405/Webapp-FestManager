import { describe, it, expect } from 'vitest';
import { eventSchema, staffSchema, clientSchema, expenseSchema, inventoryItemSchema } from './validations';

describe('eventSchema', () => {
  it('pass khi dữ liệu hợp lệ', () => {
    const result = eventSchema.safeParse({ name: 'Festival Mùa Hè', startDate: '2026-07-15', location: 'Paris' });
    expect(result.success).toBe(true);
  });

  it('pass khi có cả endDate hợp lệ', () => {
    const result = eventSchema.safeParse({ name: 'Test', startDate: '2026-07-15', endDate: '2026-07-20', location: 'Lyon' });
    expect(result.success).toBe(true);
  });

  it('lỗi khi tên rỗng', () => {
    const result = eventSchema.safeParse({ name: '', startDate: '2026-07-15', location: 'Paris' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Tên sự kiện là bắt buộc');
  });

  it('lỗi khi thiếu ngày bắt đầu', () => {
    const result = eventSchema.safeParse({ name: 'Test', startDate: '', location: 'Paris' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Ngày bắt đầu là bắt buộc');
  });

  it('lỗi khi thiếu địa điểm', () => {
    const result = eventSchema.safeParse({ name: 'Test', startDate: '2026-07-15', location: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Địa điểm là bắt buộc');
  });

  it('lỗi khi endDate trước startDate', () => {
    const result = eventSchema.safeParse({ name: 'Test', startDate: '2026-07-20', endDate: '2026-07-15', location: 'Paris' });
    expect(result.success).toBe(false);
    const endDateError = result.error?.issues.find(i => i.path.includes('endDate'));
    expect(endDateError?.message).toBe('Ngày kết thúc phải sau ngày bắt đầu');
  });

  it('pass khi endDate bằng startDate', () => {
    const result = eventSchema.safeParse({ name: 'Test', startDate: '2026-07-15', endDate: '2026-07-15', location: 'Paris' });
    expect(result.success).toBe(true);
  });
});

describe('staffSchema', () => {
  it('pass khi dữ liệu hợp lệ', () => {
    const result = staffSchema.safeParse({ name: 'Nguyễn Văn A', city: 'Paris' });
    expect(result.success).toBe(true);
  });

  it('pass khi có dob và username', () => {
    const result = staffSchema.safeParse({ name: 'Test', city: 'Lyon', dob: '2000-01-15', username: 'testacc' });
    expect(result.success).toBe(true);
  });

  it('lỗi khi thiếu tên', () => {
    const result = staffSchema.safeParse({ name: '', city: 'Paris' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Tên là bắt buộc');
  });

  it('lỗi khi thiếu thành phố', () => {
    const result = staffSchema.safeParse({ name: 'Test', city: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Thành phố là bắt buộc');
  });
});

describe('clientSchema', () => {
  it('pass khi chỉ có tên', () => {
    const result = clientSchema.safeParse({ name: 'Công ty ABC' });
    expect(result.success).toBe(true);
  });

  it('pass khi có đầy đủ thông tin', () => {
    const result = clientSchema.safeParse({
      name: 'Công ty ABC', contactName: 'Nguyễn A', phone: '+33123456789',
      email: 'test@example.com', city: 'Paris', notes: 'Ghi chú',
    });
    expect(result.success).toBe(true);
  });

  it('lỗi khi tên rỗng', () => {
    const result = clientSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Tên tổ chức là bắt buộc');
  });

  it('lỗi khi email sai định dạng', () => {
    const result = clientSchema.safeParse({ name: 'Test', email: 'not-an-email' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Email không hợp lệ');
  });

  it('pass khi email rỗng', () => {
    const result = clientSchema.safeParse({ name: 'Test', email: '' });
    expect(result.success).toBe(true);
  });
});

describe('expenseSchema', () => {
  it('pass khi dữ liệu hợp lệ', () => {
    const result = expenseSchema.safeParse({ category: 'Vé tàu/xe', amount: '150', date: '2026-07-15' });
    expect(result.success).toBe(true);
  });

  it('lỗi khi thiếu số tiền', () => {
    const result = expenseSchema.safeParse({ category: 'Ăn uống', amount: '', date: '2026-07-15' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Số tiền là bắt buộc');
  });

  it('lỗi khi số tiền âm hoặc bằng 0', () => {
    const result = expenseSchema.safeParse({ category: 'Khác', amount: '-50', date: '2026-07-15' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Số tiền phải lớn hơn 0');
  });

  it('lỗi khi thiếu ngày', () => {
    const result = expenseSchema.safeParse({ category: 'Uber/Taxi', amount: '20', date: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Ngày là bắt buộc');
  });

  it('lỗi khi category không hợp lệ', () => {
    const result = expenseSchema.safeParse({ category: 'Unknown', amount: '100', date: '2026-07-15' });
    expect(result.success).toBe(false);
  });
});

describe('inventoryItemSchema', () => {
  it('pass khi dữ liệu hợp lệ', () => {
    const result = inventoryItemSchema.safeParse({ name: 'Gạo', current: '50', unit: 'kg' });
    expect(result.success).toBe(true);
  });

  it('pass khi có threshold', () => {
    const result = inventoryItemSchema.safeParse({ name: 'Gạo', current: '50', threshold: '10', unit: 'kg' });
    expect(result.success).toBe(true);
  });

  it('lỗi khi tên rỗng', () => {
    const result = inventoryItemSchema.safeParse({ name: '', current: '50', unit: 'kg' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Tên mặt hàng là bắt buộc');
  });

  it('lỗi khi thiếu số lượng', () => {
    const result = inventoryItemSchema.safeParse({ name: 'Gạo', current: '', unit: 'kg' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Số lượng là bắt buộc');
  });

  it('lỗi khi số lượng âm', () => {
    const result = inventoryItemSchema.safeParse({ name: 'Gạo', current: '-5', unit: 'kg' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Số lượng không được âm');
  });

  it('pass khi số lượng bằng 0', () => {
    const result = inventoryItemSchema.safeParse({ name: 'Gạo', current: '0', unit: 'kg' });
    expect(result.success).toBe(true);
  });

  it('lỗi khi thiếu đơn vị', () => {
    const result = inventoryItemSchema.safeParse({ name: 'Gạo', current: '50', unit: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Đơn vị là bắt buộc');
  });
});
