import { FileSpreadsheet } from 'lucide-react';
import { Button } from '@heroui/react';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';

export default function FinanceExport() {
  const { data: events = [] } = useEventsQuery();

  const handleExport = async () => {
    const XLSX = await import('xlsx');
    const rows = events.map(event => {
      const expTotal = Object.values(event.financials.expenses).reduce<number>((s, v) => s + (v ?? 0), 0);
      const approvedReceipts = event.receipts.filter(r => r.status === 'approved').reduce((s, r) => s + r.amount, 0);
      const totalExp = expTotal + approvedReceipts;
      return {
        'Sự kiện': event.name,
        'Ngày': event.date,
        'Địa điểm': event.location,
        'Trạng thái': event.status,
        'Doanh thu (€)': event.financials.income,
        'Chi phí (€)': totalExp,
        'Lợi nhuận (€)': event.financials.income - totalExp,
        'Số nhân viên': event.staff.length,
        'Số chi phí chờ duyệt': event.receipts.filter(r => r.status === 'pending').length,
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo tài chính');
    XLSX.writeFile(wb, 'festmanager-bao-cao-tai-chinh.xlsx');
  };

  return (
    <Button
      onPress={handleExport}
      variant="ghost"
      className="flex items-center gap-1.5 rounded-xl bg-success/10 text-success hover:bg-success/20 border border-success/20 shadow-lg px-4 h-12 text-sm font-bold"
    >
      <FileSpreadsheet size={16} /> Xuất Excel
    </Button>
  );
}
