import React from 'react';
import { Button } from './ui/Button';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  className = ''
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border p-4 backdrop-blur-sm bg-background/50 ${className}`}>
      <div className="flex items-center space-x-3 mb-3 sm:mb-0">
        {icon && <div className="text-primary">{icon}</div>}
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}