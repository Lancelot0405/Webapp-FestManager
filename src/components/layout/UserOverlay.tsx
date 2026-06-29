import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { createPortal } from 'react-dom';
import UserSheetContent from './UserSheetContent';

interface Notification { id: string; message: string; timestamp: string; type: string }

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  notifications: Notification[];
  clearAll: () => void;
  clearOne: (id: string) => void;
}

export default function UserOverlay({ isOpen, onClose, onLogout, notifications, clearAll, clearOne }: Props) {
  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.y > 80 || info.velocity.y > 500) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] md:hidden">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 max-h-[90dvh] flex flex-col rounded-t-3xl border-t border-white/20 dark:border-white/10 bg-surface/80 bg-gradient-to-br from-accent/15 to-transparent backdrop-blur-2xl backdrop-saturate-150 shadow-2xl pb-safe"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
          >
            {/* Drag handle */}
            <div className="shrink-0 flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1.5 rounded-full bg-foreground/20" />
            </div>
            <div className="overflow-y-auto overflow-x-hidden">
              <UserSheetContent
                onClose={onClose}
                onLogout={() => { onClose(); onLogout(); }}
                notifications={notifications}
                clearAll={clearAll}
                clearOne={clearOne}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
