import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GitHubConfig {
  token: string;
  apiVersion: string;
  baseUrl?: string;
  scopes: string[];
}

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

interface WorkflowSettings {
  collaborationEnabled: boolean;
  taskPlanningEnabled: boolean;
  parallelTasks: number;
  logTaskPlanning: boolean;
  logAgentComm: boolean;
}

type ProviderId = 'perplexity' | 'tavily' | 'google' | 'serp';

interface SearchProviderConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  searchDepth?: 'basic' | 'advanced';
  searchEngineId?: string;
  resultsPerPage?: number;
}

interface SearchConfig {
  enabledProviders: ProviderId[];
  providers: {
    [K in ProviderId]: SearchProviderConfig;
  };
  rag: {
    enabled: boolean;
    similarityThreshold: number;
    maxResults: number;
  };
  fallbackStrategy: 'sequential' | 'parallel';
}

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
  githubConfig: GitHubConfig;
  firebaseConfig: FirebaseConfig;
  searchConfig: SearchConfig;
  workflowSettings: WorkflowSettings;
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
  setGithubConfig: (config: GitHubConfig) => void;
  setFirebaseConfig: (config: FirebaseConfig) => void;
  setSearchConfig: (config: SearchConfig) => void;
  setWorkflowSettings: (settings: WorkflowSettings) => void;
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
      githubConfig: {
        token: '',
        apiVersion: '2022-11-28',
        scopes: ['repo', 'read:user', 'read:org']
      },
      firebaseConfig: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: ''
      },
      workflowSettings: {
        collaborationEnabled: false,
        taskPlanningEnabled: false,
        parallelTasks: 1,
        logTaskPlanning: false,
        logAgentComm: false
      },
      searchConfig: {
        enabledProviders: ['perplexity'],
        providers: {
          perplexity: {
            model: 'llama-3.1-sonar-small-128k-online',
            maxTokens: 4096
          },
          tavily: {
            searchDepth: 'basic'
          },
          google: {
            resultsPerPage: 10
          },
          serp: {
            resultsPerPage: 10
          }
        },
        rag: {
          enabled: true,
          similarityThreshold: 0.8,
          maxResults: 10
        },
        fallbackStrategy: 'sequential'
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
      setGithubConfig: (config) => set({ githubConfig: config }),
      setFirebaseConfig: (config) => set({ firebaseConfig: config }),
      setSearchConfig: (config) => set({ searchConfig: config }),
      setWorkflowSettings: (settings) => set({ workflowSettings: settings }),
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
        githubConfig: state.githubConfig,
        firebaseConfig: state.firebaseConfig,
        searchConfig: state.searchConfig,
        workflowSettings: state.workflowSettings,
        sidebarOpen: state.sidebarOpen,
        loggingOpen: state.loggingOpen
      }),
    }
  )
);

export type { ProviderId, FirebaseConfig, GitHubConfig, SearchConfig, WorkflowSettings };
