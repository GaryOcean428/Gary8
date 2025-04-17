import React from 'react';
import { Button } from './ui/Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      <div className="text-muted-foreground mb-4 h-12 w-12">
        {icon}
      </div>
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        {description}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        {action && (
          <Button
            onClick={action.onClick}
            variant="default"
            leftIcon={action.icon}
          >
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            onClick={secondaryAction.onClick}
            variant="outline"
            leftIcon={secondaryAction.icon}
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}