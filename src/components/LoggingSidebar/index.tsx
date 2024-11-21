import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, Pause, Play, Filter, X } from 'lucide-react';
import { ThoughtLog } from './ThoughtLog';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useResizePanel } from '../../hooks/useResizePanel';
import { thoughtLogger, type Thought, type ThoughtType } from '../../lib/logging/thought-logger';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface LoggingSidebarProps {
  onClose: () => void;
}

export function LoggingSidebar({ onClose }: LoggingSidebarProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<ThoughtType>>(new Set());
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [width, setWidth] = useLocalStorage('logSidebar.width', 400);
  const [showFilters, setShowFilters] = useState(false);
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  const { isDragging, startResize } = useResizePanel(width, setWidth, 300, 600);

  useEffect(() => {
    const unsubscribe = thoughtLogger.subscribe(newThoughts => {
      if (!isPaused) {
        setThoughts(newThoughts);
      }
    });

    return () => unsubscribe();
  }, [isPaused]);

  useEffect(() => {
    if (!isPaused && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [thoughts, isPaused]);

  const filteredThoughts = thoughts.filter(thought => {
    const matchesSearch = searchTerm === '' || 
      thought.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilters.size === 0 || 
      activeFilters.has(thought.level);
    return matchesSearch && matchesFilter;
  });

  const toggleFilter = (type: ThoughtType) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(type)) {
      newFilters.delete(type);
    } else {
      newFilters.add(type);
    }
    setActiveFilters(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters(new Set());
    setSearchTerm('');
  };

  return (
    <div 
      className={cn(
        "h-full bg-background/95 backdrop-blur-sm border-l border-border flex flex-col",
        isDragging && "select-none"
      )}
      style={{ width }}
    >
      {/* Resize Handle */}
      <div
        className={cn(
          "absolute left-0 top-0 w-1 h-full cursor-ew-resize hover:bg-primary transition-colors",
          isDragging && "bg-primary"
        )}
        onMouseDown={startResize}
      />

      {/* Header */}
      <div className="flex-none p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">System Thoughts</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                showFilters || activeFilters.size > 0
                  ? "text-primary hover:text-primary/80"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={cn(
                "p-2 rounded-lg",
                isPaused ? "text-green-400 hover:text-green-300" : "text-yellow-400 hover:text-yellow-300"
              )}
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search thoughts..."
            className="w-full bg-secondary text-foreground rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 space-y-2 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Thought Types</span>
                {activeFilters.size > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear filters
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.values(thoughtLogger.getThoughtTypes()).map(type => (
                  <button
                    key={type}
                    onClick={() => toggleFilter(type)}
                    className={cn(
                      "px-3 py-1 text-xs rounded-full transition-colors",
                      activeFilters.has(type)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Thoughts */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence initial={false}>
          {filteredThoughts.map((thought) => (
            <ThoughtLog key={thought.id} thought={thought} />
          ))}
        </AnimatePresence>
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}