'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MainContent } from '../MainContent';
import { LoggingSidebar } from '../LoggingSidebar';
import type { ActivePanel } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  activePanel: ActivePanel;
  onPanelChange: (panel: ActivePanel) => void;
  children?: React.ReactNode;
}

export function Layout({ activePanel, onPanelChange, children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useLocalStorage('sidebar.open', true);
  const [isLoggingOpen, setIsLoggingOpen] = useLocalStorage('logging.open', true);

  return (
    <div className="flex h-screen bg-background">
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <Header 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onToggleLogger={() => setIsLoggingOpen(!isLoggingOpen)} 
        />
        <main className="flex-1 overflow-auto">
          <MainContent activePanel={activePanel} />
          {children}
        </main>
      </div>

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
    </div>
  );
}
