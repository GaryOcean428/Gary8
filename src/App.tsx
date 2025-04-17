import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/layout/Layout';
import { Chat } from './features/chat';
import { Canvas } from './components/Canvas';
import { AgentPanel } from './components/panels/AgentPanel';
import { ToolsPanel } from './components/panels/ToolsPanel';
import { DocumentWorkspace } from './features/documents';
import { SettingsPanel } from './features/settings';
import { UserProfileComponent } from './components/UserProfile';
import { SearchProvider } from './context/SearchContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './core/auth/AuthProvider';
import { AuthGuard } from './components/auth/AuthGuard';
import { OptimizedChat } from './components/optimized/OptimizedChat';
import { useLocalStorage } from './shared/hooks/useLocalStorage';
import { WifiOff } from 'lucide-react';
import { Brain } from 'lucide-react';

export type ActivePanel = 'chat' | 'canvas' | 'agent' | 'tools' | 'settings' | 'documents' | 'profile';

export default function App() {
  const [activePanel, setActivePanel] = useState<ActivePanel>('chat');
  const [useOptimizedChat, setUseOptimizedChat] = useLocalStorage('useOptimizedUI', false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Initialize theme from local storage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // Check system preference
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDarkMode ? 'dark' : 'light');
    }

    // Monitor online/offline status
    const handleOnline = () => {
      setIsOffline(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const renderPanel = () => {
    switch (activePanel) {
      case 'chat':
        return useOptimizedChat ? <OptimizedChat /> : <Chat />;
      case 'canvas':
        return <Canvas />;
      case 'agent':
        return <AgentPanel />;
      case 'tools':
        return <ToolsPanel />;
      case 'documents':
        return <DocumentWorkspace />;
      case 'settings':
        return <SettingsPanel onToggleOptimizedUI={() => setUseOptimizedChat(!useOptimizedChat)} optimizedUI={useOptimizedChat} />;
      case 'profile':
        return <UserProfileComponent />;
      default:
        return useOptimizedChat ? <OptimizedChat /> : <Chat />;
    }
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <SearchProvider>
            {isOffline ? (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="card-glass p-8 rounded-xl shadow-xl flex items-center space-x-4 max-w-md">
                  <div className="bg-destructive/20 rounded-full p-3 glow-destructive">
                    <WifiOff className="w-6 h-6 text-destructive animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">No Connection</h3>
                    <p className="text-sm text-muted-foreground">Please check your internet connection and try again</p>
                  </div>
                </div>
              </div>
            ) : (
              <AuthGuard>
                <Layout 
                  activePanel={activePanel} 
                  onPanelChange={setActivePanel}
                >
                  {renderPanel()}
                </Layout>
              </AuthGuard>
            )}
          </SearchProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}