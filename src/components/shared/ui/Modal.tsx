import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  onClose:    () => void;
  children:   ReactNode;
  className?: string;
  /** 'bottom' (default) = bottom-sheet · 'center' = centered dialog */
  position?:  'bottom' | 'center';
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
  'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export default function Modal({
  onClose,
  children,
  className = '',
  position  = 'bottom',
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const first = panel.querySelectorAll<HTMLElement>(FOCUSABLE)[0];
    first?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;

      const focusable = Array.from(panel!.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;

      const f = focusable[0];
      const l = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === f) { e.preventDefault(); l.focus(); }
      } else {
        if (document.activeElement === l) { e.preventDefault(); f.focus(); }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const posClass = position === 'center'
    ? 'items-center justify-center'
    : 'items-end justify-center';

  return (
    <div
      className={`fixed inset-0 z-50 flex ${posClass} bg-espresso-800/60 dark:bg-black/70 backdrop-blur-sm`}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={className}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
