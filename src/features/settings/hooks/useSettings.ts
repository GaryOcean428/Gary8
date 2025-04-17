import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useToast } from '../../../shared/hooks/useToast';

interface SettingsState {
  apiKeys: Record<string, string>;
  useEdgeFunctions: boolean;
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
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
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
  theme: {
    mode: 'light' | 'dark' | 'system';
    colors: Record<string, string>;
  };
}

interface SettingsStore extends SettingsState {
  updateSettings: (settings: Partial<SettingsState>) => Promise<void>;
}

const defaultSettings: SettingsState = {
  apiKeys: {},
  useEdgeFunctions: true,
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
    defaultModel: 'llama-3.3-70b-versatile',
    enabledModels: [
      'llama-3.3-70b-versatile',
      'gpt-4o-mini',
      'claude-3.5-haiku-latest',
      'grok-3-mini-latest',
      'gemini-2.0-flash-lite'
    ],
    temperature: 0.7,
    maxTokens: 8192,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0
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
  theme: {
    mode: 'dark',
    colors: {
      primary: '#3B82F6',
      secondary: '#6B7280',
      accent: '#10B981',
      background: '#111827',
      surface: '#1F2937',
      text: '#F3F4F6'
    }
  }
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      updateSettings: async (newSettings) => {
        set((state) => ({
          ...state,
          ...newSettings
        }));
        return Promise.resolve();
      }
    }),
    {
      name: 'agent-one-settings',
    }
  )
);

export function useSettings() {
  const settings = useSettingsStore();
  const { addToast } = useToast();

  const updateSettings = async (newSettings: Partial<SettingsState>) => {
    try {
      await settings.updateSettings(newSettings);
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
  };

  return {
    settings,
    updateSettings
  };
}