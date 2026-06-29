import type { ReactNode } from 'react';
import { Button, EmptyState as HeroEmptyState } from '@heroui/react';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <HeroEmptyState className={`flex flex-col items-center justify-center text-center px-6 py-12 ${className ?? ''}`}>
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-default/40 flex items-center justify-center text-muted mb-3">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted mt-1 max-w-xs leading-snug">{description}</p>
      )}
      {action && (
        <Button variant="primary" size="sm" onPress={action.onPress} className="rounded-xl mt-4">
          {action.label}
        </Button>
      )}
    </HeroEmptyState>
  );
}
