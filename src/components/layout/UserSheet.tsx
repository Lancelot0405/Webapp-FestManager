import { Drawer } from '@heroui/react';
import UserSheetContent from './UserSheetContent';

interface Notification { id: string; message: string; timestamp: string; type: string }

interface UserSheetProps {
  isOpen:        boolean;
  onClose:       () => void;
  onLogout:      () => void;
  notifications: Notification[];
  clearAll:      () => void;
  clearOne:      (id: string) => void;
}

export default function UserSheet({ isOpen, onClose, onLogout, notifications, clearAll, clearOne }: UserSheetProps) {
  return (
    <Drawer.Root isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Drawer.Backdrop
        isDismissable
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
      >
        <Drawer.Content
          placement="bottom"
          className="fixed inset-x-0 bottom-0 z-50 outline-none md:hidden"
        >
          <Drawer.Dialog
            aria-label="Tài khoản"
            className="mx-auto max-w-md rounded-t-[2rem] overflow-hidden border border-separator shadow-lg dark:shadow-black/40 bg-surface/90 outline-none"
            style={{ backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}
          >
            <Drawer.Handle className="mt-3 mb-1 bg-muted/30" />
            <div style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 80px)' }}>
              <UserSheetContent
                onClose={onClose}
                onLogout={onLogout}
                notifications={notifications}
                clearAll={clearAll}
                clearOne={clearOne}
              />
            </div>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer.Root>
  );
}
