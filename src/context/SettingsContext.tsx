import React, { createContext, useContext, useState, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../hooks/useToast';

interface Settings {
  theme: 'light' | 'dark' | 'system';
  apiKeys: {
    xai: string;
    groq: string;
    perplexity: string;
    huggingface: string;
    github: string;
  };
  performance: {
    temperature: number;
    maxTokens: number;
    streaming: boolean;
  };
  memory: {
    enabled: boolean;
    contextSize: number;
    memoryLimit: number;
    vectorMemoryEnabled: boolean;
  };
  models: {
    defaultModel: string;
    enabledModels: string[];
  };
  notifications: {
    enabled: boolean;
    sound: boolean;
    showErrors: boolean;
    showSuccess: boolean;
  };
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  setTheme: (theme: Settings['theme']) => void;
}

const defaultSettings: Settings = {
  theme: 'system',
  apiKeys: {
    xai: '',
    groq: '',
    perplexity: '',
    huggingface: '',
    github: ''
  },
  performance: {
    temperature: 0.7,
    maxTokens: 2048,
    streaming: true
  },
  memory: {
    enabled: true,
    contextSize: 4096,
    memoryLimit: 1000,
    vectorMemoryEnabled: true
  },
  models: {
    defaultModel: 'grok-beta',
    enabledModels: ['grok-beta', 'llama-3.2-70b-preview', 'llama-3.2-7b-preview']
  },
  notifications: {
    enabled: true,
    sound: true,
    showErrors: true,
    showSuccess: true
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useLocalStorage<Settings>('app-settings', defaultSettings);
  const { addToast } = useToast();

  const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
    try {
      const updated = {
        ...settings,
        ...newSettings
      };
      setSettings(updated);
      addToast({
        type: 'success',
        message: 'Settings updated successfully',
        duration: 3000
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to update settings',
        message: error instanceof Error ? error.message : 'An error occurred',
        duration: 5000
      });
      throw error;
    }
  }, [settings, setSettings, addToast]);

  const setTheme = useCallback((theme: Settings['theme']) => {
    updateSettings({ theme });
  }, [updateSettings]);

  // Apply theme effect
  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (settings.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(settings.theme);
    }
  }, [settings.theme]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, setTheme }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}