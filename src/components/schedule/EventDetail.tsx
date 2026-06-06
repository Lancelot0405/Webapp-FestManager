// =============================================================================
// src/components/schedule/EventDetail.tsx
// =============================================================================

import { useState } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import EventInfoTab       from './tabs/EventInfoTab';
import EventStaffTab      from './tabs/EventStaffTab';
import EventExpensesTab   from './tabs/EventExpensesTab';
import EventInventoryTab  from './tabs/EventInventoryTab';
import EventContractsTab  from './tabs/EventContractsTab';

interface EventDetailProps {
  eventId: number;
  onBack: () => void;
}

type Tab = 'info' | 'staff' | 'expenses' | 'inventory' | 'contracts';

const TABS: { id: Tab; label: string }[] = [
  { id: 'info',      label: 'Thông tin'  },
  { id: 'staff',     label: 'Nhân sự'    },
  { id: 'expenses',  label: 'Chi phí'    },
  { id: 'inventory', label: 'Kho'        },
  { id: 'contracts', label: 'Hợp đồng'  },
];

export default function EventDetail({ eventId, onBack }: EventDetailProps) {
  const { state, deleteEvent } = useApp();
  const event = state.events.find(e => e.id === eventId);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const isAdmin = state.currentUser?.role === 'admin';

  const handleDelete = () => {
    if (!event) return;
    if (window.confirm(`Xóa sự kiện "${event.name}"?\nThao tác này không thể hoàn tác.`)) {
      deleteEvent(event.id);
      onBack();
    }
  };

  if (!event) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>Không tìm thấy sự kiện</p>
        <button onClick={onBack} className="mt-4 text-blue-600 text-sm">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-1 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={22} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-gray-800 text-lg truncate">{event.name}</h1>
          <p className="text-xs text-gray-500">{event.date} · {event.location}</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleDelete}
            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
            title="Xóa sự kiện"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'info'      && <EventInfoTab event={event} />}
      {activeTab === 'staff'     && <EventStaffTab event={event} />}
      {activeTab === 'expenses'  && <EventExpensesTab event={event} />}
      {activeTab === 'inventory' && <EventInventoryTab event={event} />}
      {activeTab === 'contracts' && <EventContractsTab event={event} />}
    </div>
  );
}
