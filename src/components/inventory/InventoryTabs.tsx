import { Store, Tent, History } from 'lucide-react';
import { Button, Chip, Tabs } from '@heroui/react';
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
        <Tabs
          selectedKey={mainTab}
          onSelectionChange={(key) => onMainTabChange(key as MainTab)}
          className="w-full"
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Khu vực kho">
              <Tabs.Tab id="restaurant">
                <span className="flex items-center gap-1.5"><Store size={14} />Nhà hàng</span>
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="festival">
                <span className="flex items-center gap-1.5"><Tent size={14} />Festival</span>
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      )}

      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
        mainTab === 'restaurant'
          ? 'bg-accent/5 border-accent/20'
          : 'bg-success/5 border-success/20'
      }`}>
        {mainTab === 'restaurant'
          ? <Store size={13} className="text-accent" />
          : <Tent  size={13} className="text-success" />
        }
        <span className={`text-xs font-bold ${mainTab === 'restaurant' ? 'text-accent' : 'text-success'}`}>
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
              className={`flex items-center gap-1.5 rounded-full ${isActive ? '' : 'border border-separator hover:border-accent/30'}`}
            >
              {id === 'history' && <History size={11} />}
              {label}
              <Chip size="sm" className={`font-bold ${isActive ? 'bg-white/20 text-accent-foreground border-0' : ''}`}>
                {count}
              </Chip>
            </Button>
          );
        })}
      </div>
    </>
  );
}
