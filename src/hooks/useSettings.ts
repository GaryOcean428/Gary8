import { useState, useCallback } from 'react';

interface Settings {
  analyticsEnabled: boolean;
  autoRecoveryEnabled: boolean;
  parallelExecutionEnabled: boolean;
  authRequired: boolean;
  rateLimitingEnabled: boolean;
  groqApiKey?: string;
  anthropicApiKey?: string;
  perplexityApiKey?: string;
  [key: string]: boolean | string | undefined;  // Index signature for dynamic keys
}

const defaultSettings: Settings = {
  analyticsEnabled: false,
  autoRecoveryEnabled: true,
  parallelExecutionEnabled: true,
  authRequired: true,
  rateLimitingEnabled: true,
  groqApiKey: '',
  anthropicApiKey: '',
  perplexityApiKey: ''
};

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('app-settings');
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    }
    return defaultSettings;
  });

  const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (typeof window !== 'undefined') {
        localStorage.setItem('app-settings', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  return {
    settings,
    updateSettings
  };
};
