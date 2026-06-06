// =============================================================================
// FESTMANAGER — MOCK DATA
// src/data/mockData.ts
//
// Đây là dữ liệu giả dùng để phát triển & test giao diện.
// Khi kết nối Supabase (Bước 7), file này sẽ được thay thế hoàn toàn
// bằng các API calls thật. Không cần xóa — chỉ cần ngừng import.
// =============================================================================

import type {
    StaffMember,
    FestivalEvent,
    InventoryItem,
    InventoryLogEntry,
  } from '../types';
  
  // -----------------------------------------------------------------------------
  // STAFF
  // -----------------------------------------------------------------------------
  
  export const MOCK_STAFF: StaffMember[] = [
    {
      id: 1,
      name: 'Lance',
      dob: '04-05-1995',
      city: 'Paris',
      contracts: [],
    },
    {
      id: 2,
      name: 'Linh',
      dob: '12-10-1998',
      city: 'Lyon',
      contracts: [
        {
          id: 999,
          date: '10-06-2026',
          url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=300&q=80',
          fileName: 'contrat_linh_juin2026.pdf',
        },
      ],
    },
    {
      id: 3,
      name: 'Minh',
      dob: '22-01-2000',
      city: 'Marseille',
      contracts: [],
    },
    {
      id: 4,
      name: 'Sophie',
      dob: '15-08-1999',
      city: 'Caen',
      contracts: [],
    },
    {
      id: 5,
      name: 'Alex',
      dob: '01-01-2000',
      city: 'Lille',
      contracts: [],
    },
  ];
  
  // -----------------------------------------------------------------------------
  // EVENTS / FESTIVALS
  // -----------------------------------------------------------------------------
  
  export const MOCK_EVENTS: FestivalEvent[] = [
    {
      id: 1,
      name: 'Paris Food Festival',
      date: '15-06-2026',
      location: 'Champ de Mars, Paris',   // ← BUG FIX: location giờ có thể nhiều từ
      status: 'Sắp tới',
      staff: [
        { id: 1, name: 'Lance', city: 'Paris' },
        { id: 2, name: 'Linh',  city: 'Lyon'  },
      ],
      financials: {
        income: 0,
        expenses: { rent: 400, ingredients: 800, transport: 45 },
      },
      inventoryReported: [],
      receipts: [
        {
          id: 101,
          staffId: "2",
          staffName: 'Linh',
          festivalId: 1,
          type: 'Vé tàu/xe',
          amount: 45,
          date: '14-06-2026',
          imageUrl:
            'https://images.unsplash.com/photo-1620052581237-5d38f29ea15c?w=200&q=80',
          status: 'pending',    // ← MỚI: trạng thái chờ duyệt
        },
      ],
      extra: {
        booth: 'A12',
        hygienePermit: 'Đang xin',
        organizerContact: '0123 456 789',
      },
    },
    {
      id: 2,
      name: 'Fête de la Musique',
      date: '21-06-2026',
      location: 'Montmartre, Paris',
      status: 'Lên kế hoạch',
      staff: [
        { id: 1, name: 'Lance', city: 'Paris' },
      ],
      financials: {
        income: 0,
        expenses: { rent: 200 },
      },
      inventoryReported: [],
      receipts: [],
      extra: {
        booth: 'TBD',
        hygienePermit: 'Chưa có',
        organizerContact: 'contact@fete.fr',
      },
    },
    {
      id: 3,
      name: 'Lyon Street Food',
      date: '01-05-2026',
      location: 'Place Bellecour, Lyon',
      status: 'Đã hoàn thành',
      staff: [
        { id: 1, name: 'Lance', city: 'Paris'     },
        { id: 3, name: 'Minh',  city: 'Marseille' },
      ],
      financials: {
        income: 3500,
        expenses: { rent: 500, ingredients: 1000, transport: 315, staff: 400 },
      },
      inventoryReported: [
        { name: 'Gà vàng',  current: 10, unit: 'kg'   },
        { name: 'Yakitori', current: 50, unit: 'xiên'  },
      ],
      receipts: [
        {
          id: 102,
          staffId: "3",
          staffName: 'Minh',
          festivalId: 3,
          type: 'Uber/Taxi',
          amount: 15,
          date: '01-05-2026',
          imageUrl:
            'https://images.unsplash.com/photo-1620052581237-5d38f29ea15c?w=200&q=80',
          status: 'approved',   // ← Đã được duyệt
        },
        {
          id: 103,
          staffId: "1",
          staffName: 'Lance',
          festivalId: 3,
          type: 'Vé tàu/xe',
          amount: 300,
          date: '30-04-2026',
          imageUrl:
            'https://images.unsplash.com/photo-1620052581237-5d38f29ea15c?w=200&q=80',
          status: 'approved',
        },
      ],
      extra: {
        booth: 'B4',
        hygienePermit: 'Đã duyệt',
        organizerContact: 'lyon@food.fr',
      },
    },
  ];
  
  // -----------------------------------------------------------------------------
  // INVENTORY
  // -----------------------------------------------------------------------------
  
  export const MOCK_INVENTORY: InventoryItem[] = [
    { id: 1, name: 'Thịt bò',      current: 5,   threshold: 10, unit: 'kg'  },
    { id: 2, name: 'Vỏ bánh bao',  current: 150, threshold: 50, unit: 'cái' },
    { id: 3, name: 'Rau xà lách',  current: 2,   threshold: 5,  unit: 'kg'  },
    { id: 4, name: 'Nước ngọt',    current: 40,  threshold: 24, unit: 'lon' },
    { id: 5, name: 'Gà vàng',      current: 8,   threshold: 5,  unit: 'kg'  },
    { id: 6, name: 'Yakitori',     current: 60,  threshold: 30, unit: 'xiên'},
  ];
  
  // -----------------------------------------------------------------------------
  // INVENTORY LOGS  ← MỚI: lịch sử các lần nhập kho
  // -----------------------------------------------------------------------------
  
  export const MOCK_INVENTORY_LOGS: InventoryLogEntry[] = [
    {
      id: 1,
      itemId: 1,
      itemName: 'Thịt bò',
      qty: 12,
      unit: 'kg',
      action: 'set',
      festivalId: 3,
      festivalName: 'Lyon Street Food',
      timestamp: '01-05-2026 22:15',
      submittedBy: 'Lance',
    },
    {
      id: 2,
      itemId: 5,
      itemName: 'Gà vàng',
      qty: 10,
      unit: 'kg',
      action: 'set',
      festivalId: 3,
      festivalName: 'Lyon Street Food',
      timestamp: '01-05-2026 22:15',
      submittedBy: 'Minh',
    },
    {
      id: 3,
      itemId: 6,
      itemName: 'Yakitori',
      qty: 50,
      unit: 'xiên',
      action: 'set',
      festivalId: 3,
      festivalName: 'Lyon Street Food',
      timestamp: '01-05-2026 22:15',
      submittedBy: 'Minh',
    },
    {
      id: 4,
      itemId: 1,
      itemName: 'Thịt bò',
      qty: 5,
      unit: 'kg',
      action: 'set',
      festivalId: null,
      festivalName: 'Kiểm kho tổng',
      timestamp: '03-05-2026 10:00',
      submittedBy: 'Lance',
    },
  ];
  
  // -----------------------------------------------------------------------------
  // HELPER: Tính tổng tài chính từ eventsData (thay thế mockFinances cũ)
  //
  // BUG FIX: Dashboard cũ dùng `mockFinances` hardcoded → số liệu không
  // bao giờ thay đổi dù thêm sự kiện mới. Hàm này tính động từ thực tế.
  // -----------------------------------------------------------------------------
  
  export function computeFinancialSummary(events: FestivalEvent[]) {
    let totalIncome  = 0;
    let totalExpense = 0;
  
    for (const event of events) {
      totalIncome += event.financials.income ?? 0;
  
      const expenseValues = Object.values(event.financials.expenses ?? {});
      for (const val of expenseValues) {
        totalExpense += val ?? 0;
      }
    }
  
    return {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
    };
  }