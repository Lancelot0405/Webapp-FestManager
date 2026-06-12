import { describe, it, expect } from 'vitest';
import {
  eventFormSchema,
  staffFormSchema,
  expenseFormSchema,
  inventoryItemSchema,
  clientFormSchema,
} from './validations';

describe('eventFormSchema', () => {
  it('passes validation for valid event payload', () => {
    const data = {
      name: 'Festival Mùa Hè',
      startDate: '2026-07-15',
      endDate: '2026-07-20',
      location: 'Paris',
    };
    const res = eventFormSchema.safeParse(data);
    expect(res.success).toBe(true);
  });

  it('fails validation when name is empty', () => {
    const data = {
      name: '',
      startDate: '2026-07-15',
      location: 'Paris',
    };
    const res = eventFormSchema.safeParse(data);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.errors[0].message).toBe('Tên sự kiện là bắt buộc');
    }
  });

  it('fails validation when endDate is before startDate', () => {
    const data = {
      name: 'Festival Mùa Hè',
      startDate: '2026-07-15',
      endDate: '2026-07-10',
      location: 'Paris',
    };
    const res = eventFormSchema.safeParse(data);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.errors[0].message).toBe('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu');
    }
  });
});

describe('staffFormSchema', () => {
  it('passes validation for valid staff payload', () => {
    const data = {
      name: 'Nguyễn Văn A',
      username: 'nguyenvana',
      dob: '1995-05-15',
      city: 'Paris',
      role: 'staff',
      department: 'restaurant',
      staffType: 'permanent',
    };
    const res = staffFormSchema.safeParse(data);
    expect(res.success).toBe(true);
  });

  it('fails validation when username has invalid characters', () => {
    const data = {
      name: 'Nguyễn Văn A',
      username: 'nguyen van a!',
      city: 'Paris',
      role: 'staff',
      department: 'restaurant',
      staffType: 'permanent',
    };
    const res = staffFormSchema.safeParse(data);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.errors[0].message).toBe('Tên đăng nhập chỉ gồm chữ, số và dấu gạch dưới');
    }
  });
});

describe('expenseFormSchema', () => {
  it('passes validation for valid expense', () => {
    const data = {
      type: 'Uber/Taxi',
      amount: '15.50',
      date: '2026-06-13',
    };
    const res = expenseFormSchema.safeParse(data);
    expect(res.success).toBe(true);
  });

  it('fails validation when amount is negative or zero', () => {
    const data = {
      type: 'Uber/Taxi',
      amount: '-5',
      date: '2026-06-13',
    };
    const res = expenseFormSchema.safeParse(data);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.errors[0].message).toBe('Số tiền phải lớn hơn 0');
    }
  });
});

describe('inventoryItemSchema', () => {
  it('passes validation for valid inventory item', () => {
    const data = {
      name: 'Thịt bò',
      current: '10.5',
      threshold: '2',
      unit: 'kg',
    };
    const res = inventoryItemSchema.safeParse(data);
    expect(res.success).toBe(true);
  });

  it('fails validation when quantity is negative', () => {
    const data = {
      name: 'Thịt bò',
      current: '-1',
      unit: 'kg',
    };
    const res = inventoryItemSchema.safeParse(data);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.errors[0].message).toBe('Số lượng không được âm');
    }
  });
});

describe('clientFormSchema', () => {
  it('passes validation for valid client', () => {
    const data = {
      name: 'Công ty ABC',
      email: 'abc@domain.com',
    };
    const res = clientFormSchema.safeParse(data);
    expect(res.success).toBe(true);
  });

  it('fails validation when email is invalid', () => {
    const data = {
      name: 'Công ty ABC',
      email: 'invalid-email',
    };
    const res = clientFormSchema.safeParse(data);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.errors[0].message).toBe('Email không hợp lệ');
    }
  });
});
