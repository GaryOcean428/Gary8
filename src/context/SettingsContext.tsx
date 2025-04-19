import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../hooks/useToast';

interface Settings {
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
    showAgentAssignments: boolean;
    showTaskCompletion: boolean;
    soundEnabled: boolean;
    volume: number;
  };
  workflow: {
    collaborationEnabled: boolean;
    taskPlanningEnabled: boolean;
    parallelTasks: number;
    logTaskPlanning: boolean;
    logAgentComm: boolean;
  };
  theme: { // Added theme property
    mode: 'light' | 'dark' | 'system';
    colors: Record<string, string>;
  };
}

// Define default theme colors matching ThemeSettings.tsx presets
const defaultThemeColors = {
  dark: {
    primary: '#3B82F6',
    secondary: '#6B7280',
    accent: '#10B981',
    background: '#111827',
    surface: '#1F2937',
    text: '#F3F4F6'
  },
  light: {
    primary: '#2563EB',
    secondary: '#4B5563',
    accent: '#059669',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#111827'
  }
};

const defaultSettings: Settings = {
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
    showSuccess: true,
    showAgentAssignments: true,
    showTaskCompletion: true,
    soundEnabled: true,
    volume: 50
  },
  workflow: {
    collaborationEnabled: true,
    taskPlanningEnabled: true,
    parallelTasks: 2,
    logTaskPlanning: true,
    logAgentComm: true
  },
  theme: { // Added default theme settings
    mode: 'dark', // Default to dark mode
    colors: defaultThemeColors.dark 
  }
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [storedSettings, setStoredSettings] = useLocalStorage<Settings>('app-settings', defaultSettings);
  const [settings, setSettings] = useState<Settings>(storedSettings);
  const { addToast } = useToast();

  useEffect(() => {
    setSettings(storedSettings);
  }, [storedSettings]);

  const updateSettings = useCallback(async (_newSettings: Partial<Settings>) => {
    try {
      const updated = {
        ...settings,
        ..._newSettings
      };
      setStoredSettings(updated);
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
  }, [settings, setStoredSettings, addToast]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
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
