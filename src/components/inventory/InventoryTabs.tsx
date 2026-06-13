import { Store, Tent, History } from 'lucide-react';
import { Button } from '@heroui/react';
import type { MainTab, SubTab } from './useInventoryFilters';

interface Props {
  mainTab: MainTab;
  subTab: SubTab;
  canSeeRestaurant: boolean;
  canSeeFestival: boolean;
  countFor: (m: MainTab, s: 'food' | 'equipment') => number;
  sectionLogsCount: number;
  sectionLabel: string;
  onMainTabChange: (tab: MainTab) => void;
  onSubTabChange: (tab: SubTab) => void;
}

export default function InventoryTabs({
  mainTab, subTab,
  canSeeRestaurant, canSeeFestival,
  countFor, sectionLogsCount, sectionLabel,
  onMainTabChange, onSubTabChange,
}: Props) {
  return (
    <>
      {canSeeRestaurant && canSeeFestival && (
        <div className="flex border-b border-[var(--glass-border)]">
          {([
            { id: 'restaurant' as MainTab, icon: <Store size={14} />, label: 'Nhà hàng', activeClass: 'text-[var(--primary)] border-[var(--primary)]' },
            { id: 'festival'   as MainTab, icon: <Tent  size={14} />, label: 'Festival',  activeClass: 'text-[var(--success)] border-[var(--success)]' },
          ]).map(t => (
            <Button
              key={t.id}
              onPress={() => onMainTabChange(t.id)}
              variant="ghost"
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold border-b-2 rounded-none h-auto transition-colors ${
                mainTab === t.id ? t.activeClass : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t.icon} {t.label}
            </Button>
          ))}
        </div>
      )}

      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
        mainTab === 'restaurant'
          ? 'bg-[var(--primary)]/5 border-[var(--primary)]/20'
          : 'bg-[var(--success)]/5 border-[var(--success)]/20'
      }`}>
        {mainTab === 'restaurant'
          ? <Store size={13} className="text-[var(--primary)]" />
          : <Tent  size={13} className="text-[var(--success)]" />
        }
        <span className={`text-xs font-bold ${mainTab === 'restaurant' ? 'text-[var(--primary)]' : 'text-[var(--success)]'}`}>
          {sectionLabel}
        </span>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {([
          { id: 'food'      as SubTab, label: 'Kho thực phẩm',  count: countFor(mainTab, 'food')      },
          { id: 'equipment' as SubTab, label: 'Trang thiết bị', count: countFor(mainTab, 'equipment') },
          { id: 'history'   as SubTab, label: 'Lịch sử',        count: sectionLogsCount               },
        ]).map(({ id, label, count }) => {
          const isActive = subTab === id;
          return (
            <Button
              key={id}
              onPress={() => onSubTabChange(id)}
              variant={isActive ? 'primary' : 'ghost'}
              size="sm"
              className={`flex items-center gap-1.5 rounded-full ${isActive ? '' : 'border border-[var(--glass-border)] hover:border-[var(--primary)]/30'}`}
            >
              {id === 'history' && <History size={11} />}
              {label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-[var(--glass-bg)] text-[var(--text-muted)]'}`}>
                {count}
              </span>
            </Button>
          );
        })}
      </div>
    </>
  );
}
