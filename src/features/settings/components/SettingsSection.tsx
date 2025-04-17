import React from 'react';

interface SettingsSectionProps {
  children: React.ReactNode;
  title?: string;
}

export function SettingsSection({ children, title }: SettingsSectionProps) {
  return (
    <div className="bg-card rounded-lg p-6">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      {children}
    </div>
  );
}