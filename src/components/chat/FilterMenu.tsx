import React from 'react';
import { motion } from 'framer-motion';

interface FilterMenuProps {
  showApiStatus: boolean;
  setShowApiStatus: (show: boolean) => void;
  filters: {
    model: string;
    searchEnabled: boolean;
    streamingEnabled: boolean;
  };
  handleModelChange: (model: string) => void;
  toggleFilter: (key: 'searchEnabled' | 'streamingEnabled') => void;
}

export function FilterMenu({
  showApiStatus,
  setShowApiStatus,
  filters,
  handleModelChange,
  toggleFilter
}: FilterMenuProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: 10 }} 
      className="absolute bottom-full left-0 mb-2 w-64 card-glass p-3 z-10"
    >
      <div className="font-medium mb-2">Chat Settings</div>
      <div className="space-y-3">
        <div className="mb-2">
          <button 
            onClick={() => setShowApiStatus(!showApiStatus)} 
            className="text-sm text-primary hover:underline"
          >
            Check API Connection Status
          </button>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Model Selection</label>
          <div className="grid grid-cols-2 gap-1 mt-1">
            {['auto', 'grok', 'claude', 'openai', 'groq'].map(_model => (
              <button 
                key={_model} 
                type="button" 
                onClick={() => handleModelChange(_model)} 
                className={`px-2 py-1 text-xs rounded-full ${
                  filters.model === _model 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {_model.charAt(0).toUpperCase() + _model.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label htmlFor="webSearchToggle" className="text-sm text-muted-foreground">
            Web Search
          </label>
          <button 
            id="webSearchToggle" 
            type="button" 
            onClick={() => toggleFilter('searchEnabled')} 
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              filters.searchEnabled ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span 
              className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${
                filters.searchEnabled ? 'translate-x-5' : 'translate-x-1'
              }`} 
            />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <label htmlFor="streamingToggle" className="text-sm text-muted-foreground">
            Streaming Response
          </label>
          <button 
            id="streamingToggle" 
            type="button" 
            onClick={() => toggleFilter('streamingEnabled')} 
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              filters.streamingEnabled ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span 
              className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${
                filters.streamingEnabled ? 'translate-x-5' : 'translate-x-1'
              }`} 
            />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
