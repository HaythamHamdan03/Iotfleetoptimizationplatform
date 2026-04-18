import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 py-10 ${className}`}
      role="status"
    >
      <Icon className="text-muted-foreground mb-3" style={{ width: 40, height: 40 }} aria-hidden="true" />
      <p className="text-[15px] font-medium text-foreground">{title}</p>
      <p className="text-[13px] text-muted-foreground mt-1 max-w-sm">{description}</p>
      {action && (
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
