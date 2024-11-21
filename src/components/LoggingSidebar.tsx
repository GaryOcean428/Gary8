import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, Pause, Play, Filter, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store';
import { ScrollArea } from './ui/ScrollArea';
import { motion, AnimatePresence } from 'framer-motion';
import { thoughtLogger, type Thought, type ThoughtType } from '../lib/logging/thought-logger';

export function LoggingSidebar() {
  const [isPaused, setIsPaused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<ThoughtType>>(new Set());
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

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

  if (isCollapsed) {
    return (
      <motion.div
        initial={{ width: 320 }}
        animate={{ width: 48 }}
        transition={{ type: 'spring', damping: 20 }}
        className="bg-background/95 backdrop-blur-sm border-l border-border flex flex-col items-center py-4"
      >
        <button
          onClick={() => setIsCollapsed(false)}
          className="text-muted-foreground hover:text-foreground p-2"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ width: 48 }}
      animate={{ width: 320 }}
      transition={{ type: 'spring', damping: 20 }}
      className="h-full bg-background/95 backdrop-blur-sm border-l border-border flex flex-col"
    >
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
              onClick={() => setIsCollapsed(true)}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
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
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          <AnimatePresence initial={false}>
            {filteredThoughts.map((thought) => (
              <motion.div
                key={thought.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                  "rounded-lg border p-4",
                  thought.level === 'error' && 'bg-red-500/10 border-red-500/20',
                  thought.level === 'warning' && 'bg-yellow-500/10 border-yellow-500/20',
                  thought.level === 'success' && 'bg-green-500/10 border-green-500/20',
                  thought.level === 'info' && 'bg-blue-500/10 border-blue-500/20'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-xs font-medium",
                    thought.level === 'error' && 'text-red-400',
                    thought.level === 'warning' && 'text-yellow-400',
                    thought.level === 'success' && 'text-green-400',
                    thought.level === 'info' && 'text-blue-400'
                  )}>
                    {thought.level.toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(thought.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">{thought.message}</p>
                {thought.metadata && (
                  <pre className="mt-2 text-xs bg-secondary/50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(thought.metadata, null, 2)}
                  </pre>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={logsEndRef} />
        </div>
      </ScrollArea>
    </motion.div>
  );
}