import { z } from 'zod';

export const eventSchema = z.object({
  name: z.string().min(1, 'Tên sự kiện là bắt buộc'),
  startDate: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
  endDate: z.string().optional(),
  location: z.string().min(1, 'Địa điểm là bắt buộc'),
}).refine(
  data => !data.endDate || !data.startDate || data.endDate >= data.startDate,
  { message: 'Ngày kết thúc phải sau ngày bắt đầu', path: ['endDate'] }
);

export const staffSchema = z.object({
  name: z.string().min(1, 'Tên là bắt buộc'),
  city: z.string().min(1, 'Thành phố là bắt buộc'),
  dob: z.string().optional(),
  username: z.string().optional(),
});

export const clientSchema = z.object({
  name: z.string().min(1, 'Tên tổ chức là bắt buộc'),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  city: z.string().optional(),
  notes: z.string().optional(),
});

export const expenseSchema = z.object({
  category: z.enum(['Vé tàu/xe', 'Uber/Taxi', 'Ăn uống', 'Khác'] as const),
  amount: z.string()
    .min(1, 'Số tiền là bắt buộc')
    .refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Số tiền phải lớn hơn 0'),
  date: z.string().min(1, 'Ngày là bắt buộc'),
});

export const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Tên mặt hàng là bắt buộc'),
  current: z.string()
    .min(1, 'Số lượng là bắt buộc')
    .refine(v => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Số lượng không được âm'),
  threshold: z.string().optional(),
  unit: z.string().min(1, 'Đơn vị là bắt buộc'),
});
