import React, { useState, useEffect } from 'react';
import { MessageSquare, Palette, Brain, Wrench, Settings, FileText, History, ChevronRight, ChevronDown } from 'lucide-react';
import type { ActivePanel } from '../App';
import { usePersistence } from '../hooks/usePersistence';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  activePanel: ActivePanel;
  onPanelChange: (panel: ActivePanel) => void;
}

export function Sidebar({ activePanel, onPanelChange }: SidebarProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [savedChats, setSavedChats] = useState<Array<{ id: string; title: string; timestamp: number }>>([]);
  const { persistenceManager } = usePersistence();

  useEffect(() => {
    const initializeSidebar = async () => {
      try {
        await persistenceManager.init();
        await loadSavedChats();
      } catch (error) {
        console.error('Failed to initialize sidebar:', error);
      }
    };

    initializeSidebar();
  }, []);

  const loadSavedChats = async () => {
    try {
      const chats = await persistenceManager.listChats();
      setSavedChats(chats);
    } catch (error) {
      console.error('Failed to load saved chats:', error);
    }
  };

  const navigationItems = [
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'canvas', icon: Palette, label: 'Canvas' },
    { id: 'agent', icon: Brain, label: 'Agent' },
    { id: 'tools', icon: Wrench, label: 'Tools' },
    { id: 'documents', icon: FileText, label: 'Documents' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ] as const;

  return (
    <div className="w-64 bg-gray-800/50 backdrop-blur-sm border-r border-gray-700/50 flex flex-col">
      {/* Navigation */}
      <div className="flex-1 p-3 space-y-1">
        {navigationItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onPanelChange(id as ActivePanel)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              activePanel === id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Chat History */}
      <div className="p-3 border-t border-gray-700/50">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-3 py-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <History className="w-5 h-5" />
            <span>Chat History</span>
          </div>
          {showHistory ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-2 space-y-1">
                {savedChats.map(chat => (
                  <button
                    key={chat.id}
                    className="w-full flex flex-col px-3 py-2 text-left text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-colors"
                  >
                    <span className="truncate">{chat.title}</span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(chat.timestamp)} ago
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}