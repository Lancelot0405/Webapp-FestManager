import { Store, Tent, Apple, Wrench, History } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MainTab, SubTab } from './useInventoryFilters';

interface Props {
  mainTab: MainTab;
  subTab: SubTab;
  canSeeRestaurant: boolean;
  canSeeFestival: boolean;
  countFor: (m: MainTab, s: 'food' | 'equipment') => number;
  sectionLogsCount: number;
  onMainTabChange: (tab: MainTab) => void;
  onSubTabChange: (tab: SubTab) => void;
}

const SECTIONS: { id: MainTab; label: string; icon: LucideIcon }[] = [
  { id: 'restaurant', label: 'Nhà hàng', icon: Store },
  { id: 'festival',   label: 'Festival', icon: Tent },
];

const CATEGORIES: { id: Exclude<SubTab, 'history'>; label: string; icon: LucideIcon }[] = [
  { id: 'food',      label: 'Thực phẩm',      icon: Apple },
  { id: 'equipment', label: 'Trang thiết bị', icon: Wrench },
];

export default function InventorySidebar({
  mainTab, subTab, canSeeRestaurant, canSeeFestival,
  countFor, sectionLogsCount, onMainTabChange, onSubTabChange,
}: Props) {
  const sections = SECTIONS.filter(
    (s) => (s.id === 'restaurant' && canSeeRestaurant) || (s.id === 'festival' && canSeeFestival)
  );

  return (
    <nav className="w-56 shrink-0 space-y-4" aria-label="Điều hướng kho">
      {sections.map((section) => {
        const isActiveSection = mainTab === section.id;
        const SectionIcon = section.icon;
        return (
          <div key={section.id}>
            <button
              type="button"
              onClick={() => { onMainTabChange(section.id); onSubTabChange('food'); }}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                isActiveSection ? 'text-foreground' : 'text-muted hover:text-foreground'
              }`}
            >
              <SectionIcon size={16} />
              {section.label}
            </button>
            {isActiveSection && (
              <div className="mt-1 space-y-0.5 pl-3">
                {CATEGORIES.map(({ id, label, icon: Icon }) => {
                  const active = subTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onSubTabChange(id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        active ? 'bg-accent/10 font-semibold text-accent' : 'text-muted hover:bg-foreground/5'
                      }`}
                    >
                      <Icon size={14} />
                      <span className="flex-1 text-left">{label}</span>
                      <span className="tabular-nums text-xs opacity-70">{countFor(section.id, id)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => onSubTabChange('history')}
        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
          subTab === 'history' ? 'bg-accent/10 text-accent' : 'text-muted hover:text-foreground'
        }`}
      >
        <History size={16} />
        <span className="flex-1 text-left">Lịch sử</span>
        <span className="tabular-nums text-xs opacity-70">{sectionLogsCount}</span>
      </button>
    </nav>
  );
}
