import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type SortKey = 'status' | 'name' | 'qty-desc' | 'qty-asc';

const SORT_OPTIONS = [
  { value: 'status',   label: 'Sắp hết trước' },
  { value: 'name',     label: 'Tên (A–Z)' },
  { value: 'qty-desc', label: 'Số lượng nhiều → ít' },
  { value: 'qty-asc',  label: 'Số lượng ít → nhiều' },
];

interface Props {
  itemLabel: string;
  search: string;
  onSearchChange: (v: string) => void;
  sort: SortKey;
  onSortChange: (v: SortKey) => void;
}

export default function InventoryToolbar({
  itemLabel, search, onSearchChange, sort, onSortChange,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={`Tìm ${itemLabel}...`}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9"
          aria-label={`Tìm ${itemLabel}`}
        />
      </div>
      <div className="sm:w-52 shrink-0">
        <Select
          value={sort}
          onValueChange={(val) => { if (val) onSortChange(val as SortKey); }}
        >
          <SelectTrigger className="w-full h-9">
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
