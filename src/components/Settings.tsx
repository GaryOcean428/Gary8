import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { useStore } from '../store';

export function Settings() {
  const { setSettingsPanelOpen } = useStore();

  React.useEffect(() => {
    setSettingsPanelOpen(true);
    return () => setSettingsPanelOpen(false);
  }, [setSettingsPanelOpen]);

  return (
    <div className="h-full flex items-center justify-center text-foreground/60">
      <div className="text-center">
        <SettingsIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Use the settings panel to configure the application</p>
      </div>
    </div>
  );
}