import React, { useState } from 'react';
import { MessageSquare, Palette, Brain, Wrench, Settings, FileText, History, Search, Download, Tag, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ActivePanel } from '../../App';
import { useChat } from '../../hooks/useChat';
import { downloadAsDocx } from '../../utils/export';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  activePanel: ActivePanel;
  onPanelChange: (panel: ActivePanel) => void;
}

export function Sidebar({ activePanel, onPanelChange }: SidebarProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { savedChats, loadChat, deleteChat } = useChat();

  const navigationItems = [
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'canvas', icon: Palette, label: 'Canvas' },
    { id: 'agent', icon: Brain, label: 'Agent' },
    { id: 'tools', icon: Wrench, label: 'Tools' },
    { id: 'documents', icon: FileText, label: 'Documents' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ] as const;

  const filteredChats = savedChats?.filter(chat => {
    const matchesSearch = chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.messages.some(msg => msg.content.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => chat.tags?.includes(tag));
    return matchesSearch && matchesTags;
  }) || [];

  const allTags = Array.from(new Set(
    savedChats?.flatMap(chat => chat.tags || []) || []
  ));

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="h-full bg-gray-800/50 backdrop-blur-sm border-r border-gray-700/50 flex flex-col">
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
          {showHistory ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 overflow-hidden"
            >
              {/* Search */}
              <div className="relative mb-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full bg-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              </div>

              {/* Tags */}
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat List */}
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {filteredChats.map(chat => (
                  <div
                    key={chat.id}
                    className="group bg-gray-700/50 rounded-lg p-2 hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => loadChat(chat.id)}
                        className="flex-1 text-left"
                      >
                        <h4 className="text-sm font-medium truncate">{chat.title}</h4>
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(chat.timestamp)} ago
                        </p>
                      </button>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => downloadAsDocx(chat)}
                          className="p-1 text-gray-400 hover:text-gray-300"
                          title="Export as DOCX"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteChat(chat.id)}
                          className="p-1 text-gray-400 hover:text-red-400"
                          title="Delete chat"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}