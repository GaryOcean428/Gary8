import React from 'react';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { LoggingSidebar } from './LoggingSidebar';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { Menu, X } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';
import type { ActivePanel } from '../App';

interface LayoutProps {
  activePanel: ActivePanel;
  onPanelChange: (panel: ActivePanel) => void;
}

export function Layout({ activePanel, onPanelChange }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useLocalStorage('sidebar.open', true);
  const [isLoggingOpen, setIsLoggingOpen] = useLocalStorage('logging.open', true);
  const { settings } = useSettings();

  return (
    <div className={cn(
      "flex h-screen overflow-hidden",
      settings.theme === 'dark' ? 'dark' : ''
    )}>
      {/* Background patterns */}
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/20 -z-10" />
      
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors lg:hidden"
        aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Main Sidebar */}
      <AnimatePresence mode="wait">
        {(isSidebarOpen || !('ontouchstart' in window)) && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed inset-y-0 left-0 w-64 z-30 lg:relative"
          >
            <Sidebar activePanel={activePanel} onPanelChange={onPanelChange} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-1 relative">
        <main className={cn(
          "flex-1 overflow-hidden transition-all duration-300",
          isSidebarOpen ? "lg:ml-64" : "lg:ml-0"
        )}>
          <MainContent activePanel={activePanel} />
        </main>

        {/* Logging Sidebar */}
        <AnimatePresence mode="wait">
          {(isLoggingOpen || !('ontouchstart' in window)) && (
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed inset-y-0 right-0 w-80 z-30 lg:relative"
            >
              <LoggingSidebar onClose={() => setIsLoggingOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Logging Toggle */}
        <button
          onClick={() => setIsLoggingOpen(!isLoggingOpen)}
          className="fixed bottom-4 right-4 z-50 p-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors lg:hidden"
          aria-label={isLoggingOpen ? 'Close logs' : 'Open logs'}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}