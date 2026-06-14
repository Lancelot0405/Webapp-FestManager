import { createContext, useContext, useState, useCallback } from 'react';

interface FABConfig {
  onPress: () => void;
  label: string;
}

interface FABContextValue {
  fab: FABConfig | null;
  setFAB: (config: FABConfig | null) => void;
}

const FABContext = createContext<FABContextValue>({ fab: null, setFAB: () => {} });

export function FABProvider({ children }: { children: React.ReactNode }) {
  const [fab, setFABState] = useState<FABConfig | null>(null);
  const setFAB = useCallback((config: FABConfig | null) => setFABState(config), []);
  return <FABContext value={{ fab, setFAB }}>{children}</FABContext>;
}

export function useFAB() {
  return useContext(FABContext);
}
