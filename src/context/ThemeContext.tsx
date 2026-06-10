import { createContext, useContext } from 'react';
import { useTheme as useNextTheme } from 'next-themes';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const { resolvedTheme, setTheme } = useNextTheme();
  const theme: Theme = resolvedTheme === 'dark' ? 'dark' : 'light';
  return {
    theme,
    toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export const useThemeContext = () => useContext(ThemeContext);
