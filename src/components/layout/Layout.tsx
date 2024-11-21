import React from 'react';
import { Sidebar } from './Sidebar';
import { LoggingSidebar } from '../LoggingSidebar';
import { Toast } from '../common/Toast';
import { LoadingOverlay } from '../common/LoadingOverlay';
import type { ActivePanel } from '../../App';
import { Menu, X } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  activePanel: ActivePanel;
  onPanelChange: (panel: ActivePanel) => void;
}

export function Layout({ children, activePanel, onPanelChange }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useLocalStorage('mobileMenu.open', false);
  const [isLoggingSidebarOpen, setIsLoggingSidebarOpen] = useLocalStorage('loggingSidebar.open', false);

  return (
    <div className="flex min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black text-gray-100">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors lg:hidden"
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Main Sidebar */}
      <AnimatePresence>
        {(isMobileMenuOpen || !('ontouchstart' in window)) && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed inset-y-0 left-0 z-40 w-64 lg:relative"
          >
            <Sidebar 
              activePanel={activePanel} 
              onPanelChange={(panel) => {
                onPanelChange(panel);
                setIsMobileMenuOpen(false);
              }} 
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative lg:ml-0 w-full">
        {/* Background patterns */}
        <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/20 -z-10" />
        
        {/* Content Area */}
        <div className="flex-1 overflow-auto pt-16 lg:pt-0">
          {children}
        </div>
      </main>

      {/* Logging Sidebar Toggle - Mobile */}
      <button
        onClick={() => setIsLoggingSidebarOpen(!isLoggingSidebarOpen)}
        className="fixed bottom-4 right-4 z-50 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors lg:hidden"
        aria-label={isLoggingSidebarOpen ? 'Close logging sidebar' : 'Open logging sidebar'}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Logging Sidebar */}
      <AnimatePresence>
        {(isLoggingSidebarOpen || !('ontouchstart' in window)) && (
          <motion.div
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed inset-y-0 right-0 z-40 w-80 lg:relative"
          >
            <LoggingSidebar />
          </motion.div>
        )}
      </AnimatePresence>

      <Toast />
      <LoadingOverlay />
    </div>
  );
}