import { Palette } from 'lucide-react';
import { ACCENT_THEMES } from '../../context/ThemeContext';
import { useTheme } from '../../context/ThemeContext';

export default function AccentPicker() {
  const { accentId, setAccent } = useTheme();

  return (
    <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl">
      <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
        <Palette size={15} className="text-accent" />
      </div>
      <span className="flex-1 text-sm font-medium text-foreground">Màu chủ đạo</span>
      <div className="flex items-center gap-1.5">
        {ACCENT_THEMES.map(t => (
          <button
            key={t.id}
            title={t.name}
            onClick={() => setAccent(t.id)}
            className="relative w-6 h-6 rounded-full shrink-0 transition-transform active:scale-90 hover:scale-110"
            style={{ background: `linear-gradient(135deg, ${t.from} 0%, ${t.to} 100%)` }}
          >
            {accentId === t.id && (
              <span className="absolute inset-0 rounded-full ring-2 ring-white dark:ring-zinc-900 ring-offset-1 ring-offset-transparent" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
