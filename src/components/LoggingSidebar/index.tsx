import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Search, Pause, Play, Filter, X } from 'lucide-react';
import { ThoughtLog } from './ThoughtLog';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useResizePanel } from '../../hooks/useResizePanel';
import { thoughtLogger, type Thought, type ThoughtType } from '../../lib/logging/thought-logger';

export function LoggingSidebar() {
  const [isVisible, setIsVisible] = useLocalStorage('logSidebar.visible', true);
  const [isPaused, setIsPaused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<ThoughtType>>(new Set());
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [width, setWidth] = useLocalStorage('logSidebar.width', 400);
  const [showFilters, setShowFilters] = useState(false);
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  const { isDragging, startResize } = useResizePanel(width, setWidth);

  // Use a layout effect to set initial thoughts during mount
  const initializeThoughts = useCallback(() => {
    setThoughts(thoughtLogger.getThoughts());
  }, []);
  
  // Initialize on mount
  useEffect(() => {
    initializeThoughts();
    
    // Set up subscription to thought logger
    const unsubscribe = thoughtLogger.subscribe(_newThoughts => {
      if (!isPaused) {
        // We're using functional updater here because we're in a subscription
        // This avoids the React warning about setState during render
        setThoughts(_newThoughts);
      }
    });

    return () => unsubscribe();
  }, [initializeThoughts, isPaused]);

  // Scroll to bottom when thoughts change and not paused
  useEffect(() => {
    if (!isPaused && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [thoughts, isPaused]);

  const filteredThoughts = thoughts.filter(_thought => {
    const matchesSearch = searchTerm === '' || 
      _thought.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilters.size === 0 || 
      activeFilters.has(_thought.level);
    return matchesSearch && matchesFilter;
  });

  const toggleFilter = (_type: ThoughtType) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(_type)) {
      newFilters.delete(_type);
    } else {
      newFilters.add(_type);
    }
    setActiveFilters(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters(new Set());
    setSearchTerm('');
  };

  return (
    <div 
      className={`fixed top-0 right-0 h-screen bg-gray-900 border-l border-gray-700 transition-all duration-300 flex flex-col ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      } sidebar-width ${isVisible ? 'visible' : 'hidden'} z-20`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 bg-gray-800 p-2 rounded-l-lg hover:bg-gray-700"
      >
        {isVisible ? <ChevronRight /> : <ChevronLeft />}
      </button>

      {/* Resize Handle */}
      <div
        className="absolute left-0 top-0 w-1 h-full cursor-ew-resize hover:bg-blue-500"
        onMouseDown={startResize}
      />

      {/* Header */}
      <div className="flex-none p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">System Thoughts</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters || activeFilters.size > 0
                  ? 'text-blue-400 hover:text-blue-300'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              aria-label="Toggle filters"
            >
              <Filter size={20} />
            </button>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`p-2 rounded-lg ${
                isPaused ? 'text-green-400 hover:text-green-300' : 'text-yellow-400 hover:text-yellow-300'
              }`}
            >
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(_e) => setSearchTerm(_e.target.value)}
            placeholder="Search thoughts..."
            className="w-full bg-gray-800 text-gray-100 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Thought Types</span>
              {activeFilters.size > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1"
                >
                  <X size={12} />
                  Clear filters
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.values(thoughtLogger.getThoughtTypes()).map(_type => (
                <button
                  key={_type}
                  onClick={() => toggleFilter(_type)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    activeFilters.has(_type)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {_type}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Thoughts */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredThoughts.map((_thought) => (
          <ThoughtLog key={_thought.id} thought={_thought} />
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
