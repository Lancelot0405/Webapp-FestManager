import { createContext, useContext, useState, useEffect } from 'react';
import { useTheme as useNextTheme } from 'next-themes';

type Theme = 'light' | 'dark';

export interface AccentTheme {
  id: string;
  name: string;
  from: string;
  to: string;
}

export const ACCENT_THEMES: AccentTheme[] = [
  { id: 'blue',   name: 'Đại dương',   from: 'oklch(62% 0.195 254)',  to: 'oklch(58% 0.22 280)'  },
  { id: 'aurora', name: 'Cực quang',   from: 'oklch(58% 0.22 295)',   to: 'oklch(65% 0.22 350)'  },
  { id: 'rose',   name: 'Hoa hồng',    from: 'oklch(64% 0.22 5)',     to: 'oklch(62% 0.20 330)'  },
  { id: 'sunset', name: 'Hoàng hôn',   from: 'oklch(70% 0.20 55)',    to: 'oklch(64% 0.24 15)'   },
  { id: 'forest', name: 'Rừng xanh',   from: 'oklch(62% 0.18 160)',   to: 'oklch(65% 0.17 195)'  },
  { id: 'cyber',  name: 'Thiên thanh', from: 'oklch(66% 0.17 200)',   to: 'oklch(62% 0.20 250)'  },
];

const LS_KEY = 'festmanager-accent';

function applyAccent(theme: AccentTheme) {
  const root = document.documentElement;
  root.style.setProperty('--accent', theme.from);
  root.style.setProperty('--focus', theme.from);
  root.style.setProperty('--accent-from', theme.from);
  root.style.setProperty('--accent-to', theme.to);
}

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  accentId: string;
  setAccent: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
  accentId: 'blue',
  setAccent: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accentId, setAccentId] = useState<string>(() => {
    try { return localStorage.getItem(LS_KEY) ?? 'blue'; } catch { return 'blue'; }
  });

  useEffect(() => {
    const theme = ACCENT_THEMES.find(t => t.id === accentId) ?? ACCENT_THEMES[0];
    applyAccent(theme);
    try { localStorage.setItem(LS_KEY, accentId); } catch { /* ignore */ }
  }, [accentId]);

  const setAccent = (id: string) => {
    if (ACCENT_THEMES.some(t => t.id === id)) setAccentId(id);
  };

  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme: () => {}, accentId, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const { resolvedTheme, setTheme } = useNextTheme();
  const theme: Theme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const { accentId, setAccent } = useContext(ThemeContext);
  return {
    theme,
    toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    accentId,
    setAccent,
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export const useThemeContext = () => useContext(ThemeContext);
