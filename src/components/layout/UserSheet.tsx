import { Card, Drawer } from '@heroui/react';
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
      <Drawer.Backdrop isDismissable variant="blur" className="md:hidden">
        <Drawer.Content placement="bottom" className="md:hidden">
          <Drawer.Dialog aria-label="Tài khoản" className="mx-auto max-w-md p-0 bg-transparent shadow-none">
            <Card className="w-full rounded-t-3xl rounded-b-none border-x border-t border-separator/60 overflow-hidden shadow-xl">
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
            </Card>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer.Root>
  );
}
