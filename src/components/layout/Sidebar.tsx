import React, { useState, useEffect } from 'react';
import { MessageSquare, Palette, Wrench, Settings, FileText, History, Search, Download, Tag, X, ChevronRight, ChevronDown, User } from 'lucide-react';
import { Brain } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ActivePanel } from '../../App';
import { useChat } from '../../hooks/useChat';
import { downloadAsDocx } from '../../utils/export';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserProfile } from '../../hooks/useUserProfile';

interface SidebarProps {
  activePanel: ActivePanel;
  onPanelChange: (panel: ActivePanel) => void;
}

export function Sidebar({ activePanel, onPanelChange }: SidebarProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { savedChats, loadChat, deleteChat } = useChat();
  const { profile, isDevUser } = useUserProfile();

  const navigationItems = [
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'canvas', icon: Palette, label: 'Canvas' },
    { id: 'agent', icon: Brain, label: 'Agent' },
    { id: 'tools', icon: Wrench, label: 'Tools' },
    { id: 'documents', icon: FileText, label: 'Documents' },
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ] as const;

  const allTags = Array.from(new Set(
    savedChats?.flatMap(_chat => _chat.tags || []) || []
  ));

  const toggleTag = (_tag: string) => {
    setSelectedTags(_prev => 
      _prev.includes(_tag) 
        ? _prev.filter(_t => _t !== _tag)
        : [..._prev, _tag]
    );
  };

  return (
    <div className="h-full bg-card/50 backdrop-blur-sm border-r border-border flex flex-col">
      {/* Header with logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden">
            {/* Use the gary.svg logo from public directory */}
            <img 
              src="/gary.svg" 
              alt="Gary8 Logo" 
              className="w-10 h-10 object-contain"
              onError={(_e) => {
                // Fallback to Brain icon if image fails to load
                _e.currentTarget.style.display = 'none';
                const parent = _e.currentTarget.parentElement;
                if (parent) {
                  const icon = document.createElement('div');
                  icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 0 19.5v-15A2.5 2.5 0 0 1 2.5 2h7z"/><path d="M14.5 2a2.5 2.5 0 0 0-2.5 2.5v15a2.5 2.5 0 0 0 2.5 2.5h7a2.5 2.5 0 0 0 2.5-2.5v-15a2.5 2.5 0 0 0-2.5-2.5h-7z"/><path d="M8 10v.01"/><path d="M16 10v.01"/><path d="M8 14v.01"/><path d="M16 14v.01"/><path d="M12 18v.01"/></svg>';
                  parent.appendChild(icon);
                }
              }}
            />
          </div>
          <span className="font-semibold text-lg">Gary8</span>
          
          {/* Show dev badge for dev users */}
          {isDevUser && (
            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary text-primary-foreground">
              DEV
            </span>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigationItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onPanelChange(id as ActivePanel)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              activePanel === id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Chat History */}
      <div className="p-3 border-t border-border/50">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-3 py-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
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
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {selectedTags.map(_tag => (
                      <button
                        key={_tag}
                        onClick={() => toggleTag(_tag)}
                        className="badge badge-primary inline-flex items-center gap-1"
                      >
                        <Tag className="w-3 h-3" />
                        {_tag}
                        <X className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="relative mb-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(_e) => setSearchTerm(_e.target.value)}
                    placeholder="Search chats..."
                    className="w-full bg-input rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                </div>

                <div className="mt-1">
                  <div className="text-xs text-muted-foreground mb-1 px-2">Available Tags</div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {allTags.map(_tag => (
                      <button
                        key={_tag}
                        onClick={() => toggleTag(_tag)}
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          selectedTags.includes(_tag) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {_tag}
                      </button>
                    ))}
                  </div>
                </div>
                
                {savedChats?.filter(_chat => {
                  // Filter by search term
                  const matchesSearch = !searchTerm || _chat.title.toLowerCase().includes(searchTerm.toLowerCase());
                  
                  // Filter by selected tags
                  const matchesTags = selectedTags.length === 0 || 
                    (_chat.tags && selectedTags.every(_tag => _chat.tags?.includes(_tag)));
                    
                  return matchesSearch && matchesTags;
                }).map(_chat => (
                  <div
                    key={_chat.id}
                    className="group card-glass rounded-lg p-2 hover:card-elevated transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => loadChat(_chat.id)}
                        className="flex-1 text-left"
                      >
                        <h4 className="text-sm font-medium truncate">{_chat.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(_chat.timestamp)} ago
                        </p>
                      </button>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => downloadAsDocx(_chat)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          title="Export as DOCX"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteChat(_chat.id)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete chat"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {_chat.tags && _chat.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {_chat.tags.slice(0, 3).map(_tag => (
                          <span
                            key={_tag}
                            className="badge badge-outline text-[10px] py-0"
                          >
                            {_tag}
                          </span>
                        ))}
                        {_chat.tags.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{_chat.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* User profile information */}
      <div className="p-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full" />
            ) : (
              <span className="text-xs font-medium">{profile?.display_name?.charAt(0) || 'U'}</span>
            )}
          </div>
          <div>
            <div className="text-sm font-medium">{profile?.display_name || 'User'}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              {profile?.role && (
                <span className={`${profile.role === 'dev' ? 'text-primary' : profile.role === 'admin' ? 'text-success' : ''}`}>
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </span>
              )} 
              {isDevUser && <span className="text-xs">• Platform Access</span>}
            </div>
          </div>
        </div>
        <button
          onClick={() => onPanelChange('profile')}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
        >
          <User className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}