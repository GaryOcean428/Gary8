import React, { createContext, useContext, useEffect } from 'react';
import { useStore } from '../store';

interface ConfigContextType {
  isInitialized: boolean;
  hasValidConfig: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [hasValidConfig, setHasValidConfig] = React.useState(false);
  const { setSettingsPanelOpen } = useStore();

  useEffect(() => {
    const checkConfig = async () => {
      const config = {
        apiKey: import.meta.env.VITE_XAI_API_KEY,
        groqApiKey: import.meta.env.VITE_GROQ_API_KEY,
        perplexityApiKey: import.meta.env.VITE_PERPLEXITY_API_KEY,
        huggingfaceToken: import.meta.env.VITE_HUGGINGFACE_TOKEN
      };

      const hasAllKeys = Object.values(config).every(Boolean);
      setHasValidConfig(hasAllKeys);
      
      if (!hasAllKeys) {
        setSettingsPanelOpen(true);
      }
      
      setIsInitialized(true);
    };

    checkConfig();
  }, [setSettingsPanelOpen]);

  return (
    <ConfigContext.Provider value={{ isInitialized, hasValidConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}