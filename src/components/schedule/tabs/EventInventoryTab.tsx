// =============================================================================
// src/components/schedule/tabs/EventInventoryTab.tsx
// =============================================================================

import { useApp } from '../../../context/AppContext';
import type { FestivalEvent } from '../../../types';

interface Props {
  event: FestivalEvent;
}

export default function EventInventoryTab({ event }: Props) {
  const { state } = useApp();
  const { inventory } = state;

  // Show global inventory with low-stock highlights
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Tồn kho hiện tại</p>

      {inventory.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu kho</p>
      ) : (
        <div className="space-y-2">
          {inventory.map(item => {
            const isLow = item.current < item.threshold;
            const isWarn = !isLow && item.current < item.threshold * 1.5;
            const bg = isLow ? 'bg-red-50 border-red-200' : isWarn ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100';
            const textColor = isLow ? 'text-red-700' : isWarn ? 'text-yellow-700' : 'text-gray-800';
            return (
              <div key={item.id} className={`rounded-xl p-3 shadow-sm border ${bg}`}>
                <div className="flex justify-between items-center">
                  <p className={`text-sm font-medium ${textColor}`}>{item.name}</p>
                  <span className={`text-sm font-bold ${textColor}`}>
                    {item.current} / {item.threshold} {item.unit}
                  </span>
                </div>
                {isLow && (
                  <p className="text-xs text-red-500 mt-0.5">Sắp hết hàng!</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reported inventory snapshot */}
      {event.inventoryReported.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Báo cáo cuối sự kiện</p>
          <div className="space-y-2">
            {event.inventoryReported.map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                <p className="text-sm text-gray-700">{item.name}</p>
                <span className="text-sm text-gray-500">{item.current} {item.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
