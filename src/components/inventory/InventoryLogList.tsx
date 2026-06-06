// =============================================================================
// src/components/inventory/InventoryLogList.tsx
// =============================================================================

import type { InventoryLogEntry } from '../../types';

interface Props {
  logs: InventoryLogEntry[];
}

export default function InventoryLogList({ logs }: Props) {
  if (logs.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-2">Lịch sử thay đổi</h2>
      <div className="space-y-2">
        {logs.map(log => (
          <div key={log.id} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-800">{log.itemName}</p>
                <p className="text-xs text-gray-500">{log.festivalName} · {log.submittedBy}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-700">{log.qty} {log.unit}</p>
                <p className="text-xs text-gray-400">{log.timestamp}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
