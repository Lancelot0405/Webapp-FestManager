import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  const colors: Record<ToastType, string> = {
    success: 'bg-[var(--success-light)]/90 text-[var(--success)] border border-[var(--success)]/20',
    error: 'bg-[var(--danger-light)]/90 text-[var(--danger)] border border-[var(--danger)]/20',
    warning: 'bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20',
    info: 'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20',
  };
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={`${colors[t.type]} text-sm font-medium px-4 py-3 rounded-2xl shadow-[var(--shadow-warm)] backdrop-blur-[var(--glass-blur)] flex items-center justify-between gap-3 cursor-pointer animate-fade-in`}
        >
          <span>{t.message}</span>
          <span className="opacity-70 text-xs shrink-0">✕</span>
        </div>
      ))}
    </div>
  );
}

// Hook co-located với context (chủ đích) — disable rule HMR-only của react-refresh.
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx.showToast;
}
