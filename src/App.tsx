import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Package, 
  DollarSign, 
  LayoutDashboard, 
  AlertTriangle,
  Plus,
  ArrowUpRight,
  FileText,
  ChevronLeft,
  Users,
  MapPin,
  PieChart,
  LogOut,
  Lock,
  Camera,
  Receipt,
  X,
  Image as ImageIcon
} from 'lucide-react';

const mockEvents = [
  { 
    id: 1, name: 'Paris Food Festival', date: '15-06-2026', location: 'Champ de Mars', status: 'Sắp tới',
    staff: [{name: 'Lance', city: 'Paris'}, {name: 'Linh', city: 'Lyon'}],
    financials: { income: 0, expenses: { rent: 400, ingredients: 800, transport: 100 } },
    inventoryReported: [],
    receipts: [
      { id: 101, staffName: 'Linh', type: 'Vé TGV (Lyon-Paris)', amount: 45, date: '14-06-2026', imageUrl: 'https://images.unsplash.com/photo-1620052581237-5d38f29ea15c?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80' }
    ],
    extra: { booth: 'A12', hygienePermit: 'Đang xin', organizerContact: '0123 456 789' }
  },
  { 
    id: 2, name: 'Fête de la Musique', date: '21-06-2026', location: 'Montmartre', status: 'Lên kế hoạch',
    staff: [{name: 'Lance', city: 'Paris'}],
    financials: { income: 0, expenses: { rent: 200 } },
    inventoryReported: [],
    receipts: [],
    extra: { booth: 'TBD', hygienePermit: 'Chưa có', organizerContact: 'contact@fete.fr' }
  },
  { 
    id: 3, name: 'Lyon Street Food', date: '01-05-2026', location: 'Lyon', status: 'Đã hoàn thành',
    staff: [{name: 'Lance', city: 'Paris'}, {name: 'Minh', city: 'Marseille'}],
    financials: { income: 3500, expenses: { rent: 500, ingredients: 1000, transport: 300, staff: 400 } },
    inventoryReported: [{name: 'Gà vàng', qty: 10, unit: 'kg'}, {name: 'Yakitori', qty: 50, unit: 'xiên'}],
    receipts: [
      { id: 102, staffName: 'Minh', type: 'Cước Uber', amount: 15, date: '01-05-2026', imageUrl: 'https://images.unsplash.com/photo-1620052581237-5d38f29ea15c?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80' }
    ],
    extra: { booth: 'B4', hygienePermit: 'Đã duyệt', organizerContact: 'lyon@food.fr' }
  }
];

const mockInventory = [
  { id: 1, name: 'Thịt bò', current: 5, threshold: 10, unit: 'kg' },
  { id: 2, name: 'Vỏ bánh bao', current: 150, threshold: 50, unit: 'cái' },
  { id: 3, name: 'Rau xà lách', current: 2, threshold: 5, unit: 'kg' },
  { id: 4, name: 'Nước ngọt', current: 40, threshold: 24, unit: 'lon' },
];

const mockFinances = {
  totalIncome: 4500,
  totalExpense: 1200,
  transactions: [
    { id: 1, type: 'income', amount: 4500, note: 'Doanh thu Paris Food Fest (Ngày 1)', date: '15-06-2026' },
    { id: 2, type: 'expense', amount: 800, note: 'Nhập nguyên liệu thịt/rau', date: '13-06-2026' },
    { id: 3, type: 'expense', amount: 400, note: 'Phí thuê gian hàng', date: '10-06-2026' },
  ]
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null); 
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [inventoryInput, setInventoryInput] = useState('');
  const [parsedInventory, setParsedInventory] = useState([]);

  // States for dynamic data
  const [eventsData, setEventsData] = useState(mockEvents);
  const [inventoryData, setInventoryData] = useState(mockInventory);
  
  // Unit editing state
  const [editingUnitId, setEditingUnitId] = useState(null);
  const unitOptions = ['kg', 'g', 'lít', 'ml', 'cái', 'lon', 'hộp', 'xiên', 'thùng', 'phần'];

  // Event list states (Add quick event)
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [newEventInput, setNewEventInput] = useState('');

  // Event detail states
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [newReceipt, setNewReceipt] = useState({ type: 'Vé tàu/xe', amount: '' });
  const [receiptImage, setReceiptImage] = useState(null); 
  const [selectedStaff, setSelectedStaff] = useState(null);
  
  // Refs cho upload ảnh (Camera và Gallery tách biệt)
  const fileInputRef = useRef(null); // Camera
  const galleryInputRef = useRef(null); // Từ máy

  // Reset forms when changing events
  useEffect(() => {
    if (!selectedEvent) {
      setSelectedStaff(null);
      setShowReceiptForm(false);
      setNewReceipt({ type: 'Vé tàu/xe', amount: '' });
      setReceiptImage(null);
    }
  }, [selectedEvent]);

  const handleUnitChange = (id, newUnit) => {
    setInventoryData(prev => prev.map(item => item.id === id ? { ...item, unit: newUnit } : item));
    setEditingUnitId(null);
  };

  const handleParseInventory = () => {
    if (!inventoryInput.trim()) return;
    const items = inventoryInput.split(',').map(item => item.trim());
    let updatedInventory = [...inventoryData]; 

    const parsed = items.map(item => {
      const match = item.match(/^(.*?)\s+(\d+(?:\.\d+)?)$/);
      if (match) {
        const name = match[1].trim();
        const qty = Number(match[2]);
        let action = '';

        const existingItemIndex = updatedInventory.findIndex(
          inv => inv.name.toLowerCase() === name.toLowerCase()
        );

        if (existingItemIndex >= 0) {
          updatedInventory[existingItemIndex].current = qty;
          action = 'updated';
        } else {
          updatedInventory.push({
            id: Date.now() + Math.random(), 
            name: name,
            current: qty,
            threshold: 10, 
            unit: 'cái' 
          });
          action = 'created';
        }
        return { name, qty, status: 'success', action };
      }
      return { name: item, qty: 0, status: 'error' };
    });

    setParsedInventory(parsed);
    setInventoryData(updatedInventory); 
    setInventoryInput(''); 
  };

  const handleAddEvent = () => {
    if (!newEventInput.trim()) return;
    
    // Tách chuỗi theo dấu cách. Giả định từ cuối cùng là Thành phố, phần trước đó là Tên sự kiện.
    // VD: "Otaku Caen" -> parts = ["Otaku", "Caen"]
    const parts = newEventInput.trim().split(/\s+/);
    let location = 'Chưa xác định';
    let name = newEventInput.trim();

    if (parts.length > 1) {
      location = parts.pop(); // Lấy phần tử cuối làm thành phố
      name = parts.join(' '); // Nối các phần tử còn lại làm tên
    }

    const todayStr = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');

    const newEventObj = {
      id: Date.now(),
      name: name,
      date: todayStr, // Lấy ngày hiện tại làm mặc định
      location: location,
      status: 'Lên kế hoạch',
      staff: [{name: currentUser.name, city: location}], // Tự động thêm admin vào
      financials: { income: 0, expenses: { rent: 0 } },
      inventoryReported: [],
      receipts: [],
      extra: { booth: 'TBD', hygienePermit: 'Chưa xin', organizerContact: 'Chưa có' }
    };

    setEventsData([newEventObj, ...eventsData]);
    setNewEventInput('');
    setShowAddEventForm(false);
  };

  // Hàm xử lý khi chọn ảnh từ Camera hoặc Gallery
  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result); // Lưu ảnh dưới dạng Base64
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadReceipt = (event) => {
    if (!newReceipt.amount) {
      alert("Vui lòng nhập số tiền!"); 
      return;
    }
    const targetStaffName = selectedStaff ? selectedStaff.name : currentUser.name;
    
    const updatedEvents = eventsData.map(e => {
      if (e.id === event.id) {
        return {
          ...e,
          receipts: [
            ...(e.receipts || []),
            {
              id: Date.now(),
              staffName: targetStaffName,
              type: newReceipt.type,
              amount: Number(newReceipt.amount),
              date: new Date().toLocaleDateString('vi-VN'),
              imageUrl: receiptImage || 'https://images.unsplash.com/photo-1620052581237-5d38f29ea15c?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80' 
            }
          ]
        };
      }
      return e;
    });
    setEventsData(updatedEvents);
    setShowReceiptForm(false);
    setNewReceipt({ type: 'Vé tàu/xe', amount: '' });
    setReceiptImage(null); 
  };

  const renderDashboard = () => {
    const lowStockItems = inventoryData.filter(item => item.current <= item.threshold);
    const netProfit = mockFinances.totalIncome - mockFinances.totalExpense;
    const nextEvent = eventsData[0];

    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <h2 className="text-2xl font-bold text-gray-800">Tổng quan</h2>
        
        {nextEvent && (
          <div onClick={() => setSelectedEvent(nextEvent)} className="cursor-pointer bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg transition transform hover:scale-[1.02]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-sm">Festival tiếp theo</p>
                <h3 className="text-xl font-bold mt-1">{nextEvent.name}</h3>
                <p className="text-sm mt-2 flex items-center gap-2">
                  <Calendar size={16} /> {nextEvent.date} | {nextEvent.location}
                </p>
              </div>
              <ArrowUpRight size={24} className="text-blue-200" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {currentUser?.role === 'admin' && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm">Lợi nhuận ròng</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">€{netProfit}</p>
            </div>
          )}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Cảnh báo kho</p>
            <p className="text-xl font-bold text-red-500 mt-1 flex items-center gap-2">
              {lowStockItems.length} món <AlertTriangle size={18} />
            </p>
          </div>
        </div>

        {lowStockItems.length > 0 && (
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
            <h4 className="font-semibold text-red-800 flex items-center gap-2 mb-3">
              <AlertTriangle size={18} /> Cần nhập thêm gấp
            </h4>
            <div className="space-y-2">
              {lowStockItems.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="text-red-900 font-medium">{item.name}</span>
                  <span className="text-red-600 bg-red-100 px-2 py-1 rounded-md">
                    Còn {item.current} / {item.threshold} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSchedule = () => (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Lịch trình</h2>
        {currentUser?.role === 'admin' && (
          <button 
            onClick={() => setShowAddEventForm(!showAddEventForm)}
            className={`text-white p-2 rounded-full shadow-md transition ${showAddEventForm ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {showAddEventForm ? <X size={20} /> : <Plus size={20} />}
          </button>
        )}
      </div>

      {/* Form thêm nhanh sự kiện */}
      {showAddEventForm && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-200 animate-fade-in">
          <h3 className="font-bold text-gray-800 mb-1 text-sm">Thêm sự kiện nhanh</h3>
          <p className="text-xs text-gray-500 mb-3">Mẫu cú pháp: <strong className="text-blue-600">[Tên sự kiện] [Thành phố]</strong> (VD: Otaku Caen)</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newEventInput}
              onChange={(e) => setNewEventInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddEvent()}
              placeholder="Nhập tên sự kiện và thành phố..."
              className="flex-1 text-sm border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
            <button 
              onClick={handleAddEvent}
              className="bg-blue-600 text-white px-4 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700"
            >
              Lưu
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {eventsData.map(event => (
          <div 
            key={event.id} 
            onClick={() => setSelectedEvent(event)}
            className="cursor-pointer bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex gap-4 hover:border-blue-300 transition"
          >
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl flex flex-col items-center justify-center min-w-[60px]">
              <span className="text-lg font-bold">{event.date.split('-')[0]}</span>
              <span className="text-xs">Thg {event.date.split('-')[1]}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 text-lg">{event.name}</h3>
              <p className="text-gray-500 text-sm flex items-center gap-1 mt-1"><MapPin size={12}/> {event.location}</p>
              <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-md ${event.status === 'Đã hoàn thành' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                {event.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Kho hàng</h2>
        {currentUser?.role === 'admin' && (
          <button className="bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700">
            <Plus size={20} />
          </button>
        )}
      </div>
      
      <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
        <h3 className="text-gray-800 font-bold mb-2 flex items-center gap-2"><FileText size={18}/> Cập nhật kho thông minh</h3>
        <p className="text-gray-500 text-xs mb-3">Mẫu: Thịt bò 5.5, Xúc xích 30</p>
        <textarea 
          value={inventoryInput}
          onChange={(e) => setInventoryInput(e.target.value)}
          placeholder="Nhập đoạn text..."
          className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-3"
          rows={3}
        />
        <button 
          onClick={handleParseInventory}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium w-full shadow-sm hover:bg-blue-700 transition"
        >
          Trích xuất & Cập nhật kho
        </button>

        {parsedInventory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Kết quả nhận diện:</h4>
            <div className="space-y-2">
              {parsedInventory.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-md">
                  <span className={item.status === 'error' ? 'text-red-500 line-through' : 'text-gray-800'}>{item.name}</span>
                  {item.status === 'success' ? (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-600">{item.qty}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.action === 'created' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                        {item.action === 'created' ? '+ Thêm mới' : 'Đã cập nhật'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-red-500 text-xs">Lỗi cú pháp</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {inventoryData.map((item, index) => {
          const isLow = item.current <= item.threshold;
          const percentage = Math.min((item.current / (item.threshold * 2)) * 100, 100);
          
          return (
            <div key={item.id} className={`p-4 ${index !== inventoryData.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-800">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${isLow ? 'text-red-500' : 'text-gray-800'}`}>
                    {item.current}
                  </span>
                  
                  <div className="relative">
                    {editingUnitId === item.id ? (
                      <select 
                        autoFocus
                        onBlur={() => setEditingUnitId(null)}
                        onChange={(e) => handleUnitChange(item.id, e.target.value)}
                        className="text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded p-1 outline-none appearance-none pr-4"
                        defaultValue={item.unit}
                      >
                        {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    ) : (
                      <span 
                        onClick={() => setEditingUnitId(item.id)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded cursor-pointer transition inline-block min-w-[30px] text-center"
                      >
                        {item.unit}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderFinance = () => (
    <div className="space-y-6 pb-20 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800">Báo cáo Tài chính</h2>
      
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Hiệu quả các sự kiện</h3>
        {eventsData.map(event => {
          const totalExpense = event.financials ? Object.values(event.financials.expenses).reduce((a, b) => a + b, 0) : 0;
          const netProfit = (event.financials?.income || 0) - totalExpense;
          const isCompleted = event.status === 'Đã hoàn thành';

          return (
            <div 
              key={event.id} 
              onClick={() => setSelectedEvent(event)}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:border-blue-300 transition"
            >
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h4 className="font-bold text-gray-800">{event.name}</h4>
                  <p className="text-xs text-gray-500">{event.date}</p>
                </div>
                {isCompleted ? (
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${netProfit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {netProfit >= 0 ? 'Lãi' : 'Lỗ'}
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">Chưa chốt</span>
                )}
              </div>
              
              <div className="flex justify-between text-sm">
                <div className="text-gray-600">
                  Thu: <span className="text-emerald-600 font-semibold">€{event.financials?.income || 0}</span>
                </div>
                <div className="text-gray-600">
                  Chi: <span className="text-red-500 font-semibold">€{totalExpense}</span>
                </div>
                <div className="font-bold text-gray-800">
                  = <span className={netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}>€{netProfit}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderEventDetail = () => {
    if (!selectedEvent) return null;
    const event = eventsData.find(e => e.id === selectedEvent.id) || selectedEvent;
    const totalExpense = Object.values(event.financials.expenses).reduce((a, b) => a + b, 0);
    const netProfit = event.financials.income - totalExpense;

    if (selectedStaff) {
      const staffReceipts = (event.receipts || []).filter(r => r.staffName === selectedStaff.name);
      const totalStaffExpense = staffReceipts.reduce((sum, r) => sum + r.amount, 0);

      return (
        <div className="space-y-6 animate-fade-in pb-20">
          <button 
            onClick={() => {setSelectedStaff(null); setShowReceiptForm(false);}} 
            className="flex items-center text-blue-600 font-medium hover:bg-blue-50 px-2 py-1 rounded-lg transition -ml-2"
          >
            <ChevronLeft size={20} /> Sự kiện {event.name}
          </button>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner border border-blue-200/50">
                {selectedStaff.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedStaff.name}</h2>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={14}/> {selectedStaff.city}</p>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-6 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600"><Receipt size={18}/></div>
                <span className="font-semibold text-emerald-800 text-sm">Tổng chi phí báo cáo</span>
              </div>
              <span className="text-2xl font-black text-emerald-600">€{totalStaffExpense}</span>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 text-sm">Danh sách hoá đơn</h3>
              <button 
                onClick={() => {
                  setShowReceiptForm(!showReceiptForm);
                  setReceiptImage(null); 
                }}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${showReceiptForm ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
              >
                {showReceiptForm ? 'Hủy thao tác' : '+ Báo cáo bill'}
              </button>
            </div>

            {showReceiptForm && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 animate-fade-in space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Loại chi phí</label>
                  <select 
                    value={newReceipt.type}
                    onChange={(e) => setNewReceipt({...newReceipt, type: e.target.value})}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Vé tàu/xe</option>
                    <option>Uber/Taxi</option>
                    <option>Ăn uống</option>
                    <option>Nguyên liệu phát sinh</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Số tiền thanh toán (€)</label>
                  <input 
                    type="number" 
                    value={newReceipt.amount}
                    onChange={(e) => setNewReceipt({...newReceipt, amount: e.target.value})}
                    placeholder="Ví dụ: 45"
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Khu vực chụp/tải ảnh tách biệt */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Hình ảnh hoá đơn</label>
                  
                  {/* Input ẩn gọi Camera (dùng capture="environment") */}
                  <input 
                    type="file"
                    accept="image/*"
                    capture="environment" 
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageCapture}
                  />

                  {/* Input ẩn để chọn file/Gallery (không dùng capture) */}
                  <input 
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={galleryInputRef}
                    onChange={handleImageCapture}
                  />
                  
                  {!receiptImage ? (
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => fileInputRef.current.click()}
                        className="w-full flex flex-col items-center justify-center gap-2 py-4 border-2 border-dashed border-blue-300 bg-blue-50/50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition shadow-sm"
                      >
                        <Camera size={24} /> Chụp ảnh bill
                      </button>
                      <button 
                        onClick={() => galleryInputRef.current.click()}
                        className="w-full flex flex-col items-center justify-center gap-2 py-4 border-2 border-dashed border-emerald-300 bg-emerald-50/50 text-emerald-600 rounded-xl text-sm font-medium hover:bg-emerald-100 transition shadow-sm"
                      >
                        <ImageIcon size={24} /> Chọn từ máy
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200 shadow-sm group">
                      <img src={receiptImage} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={() => galleryInputRef.current.click()}
                            className="bg-white/90 text-gray-800 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1 hover:bg-white"
                         >
                           <ImageIcon size={14}/> Đổi ảnh khác
                         </button>
                      </div>
                      <button 
                        onClick={() => setReceiptImage(null)}
                        className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-1.5 rounded-full shadow-sm backdrop-blur-sm transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => handleUploadReceipt(event)}
                  className={`w-full font-medium py-3 rounded-lg text-sm shadow-sm transition transform ${(!newReceipt.amount || !receiptImage) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'}`}
                  disabled={!newReceipt.amount || !receiptImage}
                >
                  Gửi báo cáo vào hệ thống
                </button>
              </div>
            )}

            <div className="space-y-3">
              {staffReceipts.length > 0 ? (
                staffReceipts.map((receipt) => (
                  <div key={receipt.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:scale-105 transition">
                        <img src={receipt.imageUrl} alt="receipt" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{receipt.type}</p>
                        <p className="text-xs text-gray-500">{receipt.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">€{receipt.amount}</p>
                      {currentUser?.role === 'admin' ? (
                        <button className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded mt-1 font-semibold border border-emerald-200 hover:bg-emerald-200 transition">Duyệt & Cộng lương</button>
                      ) : (
                        <span className="text-[10px] text-orange-500 font-medium">Chờ duyệt</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">Chưa có hoá đơn nào.</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <button 
          onClick={() => setSelectedEvent(null)} 
          className="flex items-center text-blue-600 font-medium hover:bg-blue-50 px-2 py-1 rounded-lg transition -ml-2"
        >
          <ChevronLeft size={20} /> Quay lại lịch trình
        </button>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{event.name}</h2>
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1"><Calendar size={16}/> {event.date}</span>
            <span className="flex items-center gap-1"><MapPin size={16}/> {event.location}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-100 p-2 rounded-lg"><strong>Vị trí:</strong> {event.extra.booth}</div>
            <div className="bg-gray-100 p-2 rounded-lg"><strong>Giấy phép:</strong> {event.extra.hygienePermit}</div>
          </div>
        </div>

        {currentUser?.role === 'admin' && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><PieChart size={18}/> Báo cáo tài chính</h3>
            <div className="flex justify-between items-center mb-4 border-b pb-4">
              <span className="text-gray-600">Tổng thu</span>
              <span className="text-xl font-bold text-emerald-600">€{event.financials.income}</span>
            </div>
            <div className="space-y-2 mb-4">
              <p className="text-sm font-semibold text-gray-700">Chi tiết chi phí (Tổng: €{totalExpense})</p>
              {Object.entries(event.financials.expenses).map(([key, val]) => (
                <div key={key} className="flex justify-between text-sm text-gray-600">
                  <span className="capitalize">{key === 'rent' ? 'Thuê gian hàng' : key === 'ingredients' ? 'Nguyên liệu' : key === 'transport' ? 'Vận chuyển' : key === 'staff' ? 'Nhân sự' : key}</span>
                  <span className="text-red-500">-€{val}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
              <span className="font-bold text-gray-800">LỢI NHUẬN RÒNG</span>
              <span className={`text-xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {netProfit >= 0 ? '+' : ''}€{netProfit}
              </span>
            </div>
          </div>
        )}

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Users size={18}/> Nhân sự ({event.staff.length})</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">Nhấn vào nhân sự để xem & báo cáo chi phí</p>
          <div className="grid grid-cols-2 gap-3">
            {event.staff.map((p, idx) => {
              const staffTotal = (event.receipts || []).filter(r => r.staffName === p.name).reduce((sum, r) => sum + r.amount, 0);
              return (
                <div 
                  key={idx} 
                  onClick={() => setSelectedStaff(p)}
                  className="cursor-pointer bg-blue-50 border border-blue-100 p-3 rounded-xl hover:bg-blue-100 hover:border-blue-300 transition group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-8 h-8 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">{p.name.charAt(0)}</div>
                    <ChevronLeft size={16} className="text-blue-400 rotate-180 group-hover:text-blue-600 transition" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{p.name}</p>
                    <p className="text-[10px] text-gray-500 flex justify-between">
                      <span>{p.city}</span>
                      {staffTotal > 0 && <span className="font-bold text-emerald-600">€{staffTotal}</span>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {event.inventoryReported.length > 0 && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Package size={18}/> Tồn kho báo cáo về</h3>
            <div className="space-y-2">
              {event.inventoryReported.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg text-sm">
                  <span className="text-gray-800 font-medium">{item.name}</span>
                  <span className="text-gray-600 bg-white px-2 py-1 rounded shadow-sm">{item.qty} {item.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans">
      {!currentUser ? (
        <div className="w-full max-w-md bg-white min-h-screen relative shadow-2xl flex flex-col items-center justify-center p-8 animate-fade-in">
          <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner border border-blue-100">
            <Lock size={48} strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 tracking-tight">
            FestManager
          </h1>
          <p className="text-gray-500 mb-12 text-center text-sm font-medium px-4">Hệ thống quản lý F&B lưu động thông minh</p>
          
          <div className="w-full space-y-4">
            <button 
              onClick={() => setCurrentUser({ role: 'admin', name: 'Lance' })}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition transform active:scale-95 flex justify-center items-center gap-2"
            >
              <span>Vào bằng quyền Quản lý</span>
            </button>
            <div className="relative py-4 flex items-center justify-center">
              <div className="border-b border-gray-200 w-full"></div>
              <span className="absolute bg-white px-3 text-xs text-gray-400 font-medium">HOẶC</span>
            </div>
            <button 
              onClick={() => setCurrentUser({ role: 'staff', name: 'Linh' })}
              className="w-full bg-emerald-50 text-emerald-700 font-bold py-4 rounded-2xl shadow-sm border border-emerald-100 hover:bg-emerald-100 transition active:scale-95"
            >
              Vào bằng quyền Nhân sự
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md bg-gray-50 min-h-screen relative shadow-2xl overflow-hidden flex flex-col animate-fade-in">
          <header className="bg-white px-6 py-4 sticky top-0 z-10 shadow-sm flex justify-between items-center">
            <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer" onClick={() => {setActiveTab('dashboard'); setSelectedEvent(null);}}>
              FestManager
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex flex-col text-right">
                <span className="text-sm font-bold text-gray-800 leading-tight">{currentUser.name}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${currentUser.role === 'admin' ? 'text-blue-600' : 'text-emerald-600'}`}>
                  {currentUser.role === 'admin' ? 'Quản lý' : 'Nhân sự'}
                </span>
              </div>
              <button 
                onClick={() => { setCurrentUser(null); setActiveTab('dashboard'); setSelectedEvent(null); }}
                className="w-10 h-10 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 rounded-full flex items-center justify-center transition shadow-inner"
                title="Đăng xuất"
              >
                <LogOut size={18} />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
            {selectedEvent ? (
              renderEventDetail()
            ) : (
              <>
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'schedule' && renderSchedule()}
                {activeTab === 'inventory' && renderInventory()}
                {activeTab === 'finance' && currentUser.role === 'admin' && renderFinance()}
              </>
            )}
          </main>

          {!selectedEvent && (
            <nav className="bg-white border-t border-gray-200 absolute bottom-0 w-full px-6 py-3 flex justify-between items-center pb-safe z-20">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-400'}`}
              >
                <LayoutDashboard size={24} />
                <span className="text-[10px] font-medium">Tổng quan</span>
              </button>
              <button 
                onClick={() => setActiveTab('schedule')}
                className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'schedule' ? 'text-blue-600' : 'text-gray-400'}`}
              >
                <Calendar size={24} />
                <span className="text-[10px] font-medium">Lịch trình</span>
              </button>
              <button 
                onClick={() => setActiveTab('inventory')}
                className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'inventory' ? 'text-blue-600' : 'text-gray-400'}`}
              >
                <Package size={24} />
                <span className="text-[10px] font-medium">Kho hàng</span>
              </button>
              {currentUser.role === 'admin' && (
                <button 
                  onClick={() => setActiveTab('finance')}
                  className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'finance' ? 'text-blue-600' : 'text-gray-400'}`}
                >
                  <DollarSign size={24} />
                  <span className="text-[10px] font-medium">Tài chính</span>
                </button>
              )}
            </nav>
          )}
        </div>
      )}
    </div>
  );
}