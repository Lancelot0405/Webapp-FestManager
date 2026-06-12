import { z } from 'zod';

export const eventFormSchema = z.object({
  name: z.string().min(1, 'Tên sự kiện là bắt buộc').max(100, 'Tên sự kiện tối đa 100 ký tự'),
  startDate: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
  endDate: z.string().optional().or(z.literal('')),
  location: z.string().min(1, 'Địa điểm là bắt buộc'),
}).refine(data => {
  if (data.endDate && data.startDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu',
  path: ['endDate'],
});

export const staffFormSchema = z.object({
  name: z.string().min(1, 'Họ tên là bắt buộc'),
  username: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(val => !val || /^[a-zA-Z0-9_]+$/.test(val), {
      message: 'Tên đăng nhập chỉ gồm chữ, số và dấu gạch dưới',
    }),
  dob: z.string().optional().or(z.literal('')),
  city: z.string().min(1, 'Thành phố là bắt buộc'),
  role: z.enum(['admin', 'manager', 'staff']),
  department: z.enum(['restaurant', 'festival', 'both']),
  staffType: z.enum(['permanent', 'part-time']),
});

export const expenseFormSchema = z.object({
  type: z.enum(['Vé tàu/xe', 'Uber/Taxi', 'Ăn uống', 'Khác']),
  amount: z
    .string()
    .min(1, 'Số tiền là bắt buộc')
    .refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: 'Số tiền phải lớn hơn 0',
    }),
  date: z.string().min(1, 'Ngày là bắt buộc'),
});

export const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Tên mặt hàng là bắt buộc'),
  current: z
    .string()
    .min(1, 'Số lượng là bắt buộc')
    .refine(v => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
      message: 'Số lượng không được âm',
    }),
  threshold: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(v => v === undefined || v === '' || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0), {
      message: 'Cảnh báo không được âm',
    }),
  unit: z.string().min(1, 'Đơn vị là bắt buộc'),
});

export const clientFormSchema = z.object({
  name: z.string().min(1, 'Tên tổ chức là bắt buộc'),
  contactName: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().optional().or(z.literal('')).refine(val => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
    message: 'Email không hợp lệ',
  }),
  city: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});
