import React, { useEffect } from 'react';
import { Layout } from './components/Layout';
import { ToastProvider } from './providers/ToastProvider';
import { SettingsProvider } from './context/SettingsContext';
import { ConfigProvider } from './providers/ConfigProvider';
import { SearchProvider } from './context/SearchContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initializeSystem } from './lib/initialize';
import { useToast } from './hooks/useToast';
import { ConfigWarning } from './components/ConfigWarning';

export type ActivePanel = 'chat' | 'canvas' | 'agent' | 'tools' | 'documents' | 'search' | 'settings';

export default function App() {
  const [activePanel, setActivePanel] = React.useState<ActivePanel>('chat');
  const [isInitialized, setIsInitialized] = React.useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        const success = await initializeSystem();
        setIsInitialized(true);
        if (success) {
          addToast({
            type: 'success',
            message: 'System initialized successfully'
          });
        }
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Initialization Error',
          message: error instanceof Error ? error.message : 'Failed to initialize system'
        });
        // Set initialized even on error to prevent blank screen
        setIsInitialized(true);
      }
    };

    init();
  }, [addToast]);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Initializing system...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <SettingsProvider>
          <ConfigProvider>
            <SearchProvider>
              <Layout
                activePanel={activePanel}
                onPanelChange={setActivePanel}
              />
            </SearchProvider>
          </ConfigProvider>
        </SettingsProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}