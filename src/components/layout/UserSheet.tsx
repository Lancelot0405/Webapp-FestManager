import UserSheetContent from './UserSheetContent';

interface Notification { id: string; message: string; timestamp: string; type: string }

interface UserSheetProps {
  onClose:      () => void;
  onLogout:     () => void;
  notifications: Notification[];
  clearAll:     () => void;
  clearOne:     (id: string) => void;
}

export default function UserSheet({ onClose, onLogout, notifications, clearAll, clearOne }: UserSheetProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in md:hidden"
        onClick={onClose}
      />

      {/* Bottom Sheet — mobile only */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up md:hidden">
        <div
          className="mx-auto max-w-md rounded-t-[2rem] overflow-hidden border border-separator shadow-lg dark:shadow-black/40 bg-surface/90"
          style={{ backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted/30" />
          </div>
          <div style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 80px)' }}>
            <UserSheetContent
              onClose={onClose}
              onLogout={onLogout}
              notifications={notifications}
              clearAll={clearAll}
              clearOne={clearOne}
            />
          </div>
        </div>
      </div>
    </>
  );
}
