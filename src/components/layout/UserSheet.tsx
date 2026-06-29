import { Sheet, SheetContent } from '@/components/ui/sheet';
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
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="md:hidden rounded-t-3xl border-t border-border bg-background p-0 outline-none shadow-xl max-h-[85vh] overflow-y-auto"
      >
        {/* Drawer drag handle visual */}
        <div className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-muted/60 shrink-0" />
        <div style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 80px)' }}>
          <UserSheetContent
            onClose={onClose}
            onLogout={onLogout}
            notifications={notifications}
            clearAll={clearAll}
            clearOne={clearOne}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
