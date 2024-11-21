import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreState {
  activeView: 'chat' | 'canvas' | 'agent' | 'tools' | 'documents' | 'search' | 'settings';
  settingsPanelOpen: boolean;
  sidebarOpen: boolean;
  loggingOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  apiKeys: {
    xai: string;
    groq: string;
    perplexity: string;
    huggingface: string;
    github: string;
    tavily: string;
  };
  logs: Array<{
    type: 'error' | 'warning' | 'info' | 'success';
    message: string;
    timestamp: number;
    details?: any;
  }>;
  setActiveView: (view: StoreState['activeView']) => void;
  setSettingsPanelOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setLoggingOpen: (open: boolean) => void;
  setTheme: (theme: StoreState['theme']) => void;
  setApiKey: (provider: keyof StoreState['apiKeys'], key: string) => void;
  addLog: (log: Omit<StoreState['logs'][number], 'timestamp'>) => void;
  clearLogs: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      activeView: 'chat',
      settingsPanelOpen: false,
      sidebarOpen: true,
      loggingOpen: true,
      theme: 'system',
      apiKeys: {
        xai: '',
        groq: '',
        perplexity: '',
        huggingface: '',
        github: '',
        tavily: ''
      },
      logs: [],
      setActiveView: (view) => set({ activeView: view }),
      setSettingsPanelOpen: (open) => set({ settingsPanelOpen: open }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setLoggingOpen: (open) => set({ loggingOpen: open }),
      setTheme: (theme) => set({ theme }),
      setApiKey: (provider, key) => set((state) => ({
        apiKeys: { ...state.apiKeys, [provider]: key }
      })),
      addLog: (log) => set((state) => ({
        logs: [...state.logs, { ...log, timestamp: Date.now() }]
      })),
      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        theme: state.theme,
        apiKeys: state.apiKeys,
        sidebarOpen: state.sidebarOpen,
        loggingOpen: state.loggingOpen
      }),
    }
  )
);