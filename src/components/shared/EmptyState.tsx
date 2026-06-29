import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 py-12 ${className ?? ''}`}>
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center text-muted mb-3">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted mt-1 max-w-xs leading-snug">{description}</p>
      )}
      {action && (
        <Button type="button" size="sm" onClick={action.onClick} className="rounded-xl mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
