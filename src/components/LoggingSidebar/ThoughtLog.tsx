import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { 
  Brain, Search, Lightbulb, CheckCircle, AlertCircle, 
  RefreshCw, Code, Database, Zap, Users, MessageSquare, 
  HardDrive, List, ArrowRight, Activity 
} from 'lucide-react';
import { Thought, ThoughtType } from '../../lib/logging/thought-logger';

interface ThoughtLogProps {
  thought: Thought;
}

export function ThoughtLog({ thought }: ThoughtLogProps) {
  const getIcon = (type: ThoughtType) => {
    switch (type) {
      case 'observation':
        return Brain;
      case 'reasoning':
        return Search;
      case 'plan':
        return Lightbulb;
      case 'decision':
        return CheckCircle;
      case 'critique':
        return AlertCircle;
      case 'reflection':
        return RefreshCw;
      case 'execution':
        return Code;
      case 'success':
        return Zap;
      case 'error':
        return AlertCircle;
      case 'agent-state':
        return Users;
      case 'agent-comm':
        return MessageSquare;
      case 'memory-op':
        return HardDrive;
      case 'task-plan':
        return List;
      default:
        return Activity;
    }
  };

  const getTypeColor = (type: ThoughtType) => {
    switch (type) {
      case 'observation':
        return 'text-blue-400 border-blue-400/20 bg-blue-400/10';
      case 'reasoning':
        return 'text-purple-400 border-purple-400/20 bg-purple-400/10';
      case 'plan':
        return 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10';
      case 'decision':
        return 'text-green-400 border-green-400/20 bg-green-400/10';
      case 'critique':
        return 'text-orange-400 border-orange-400/20 bg-orange-400/10';
      case 'reflection':
        return 'text-cyan-400 border-cyan-400/20 bg-cyan-400/10';
      case 'execution':
        return 'text-indigo-400 border-indigo-400/20 bg-indigo-400/10';
      case 'success':
        return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10';
      case 'error':
        return 'text-red-400 border-red-400/20 bg-red-400/10';
      case 'agent-state':
        return 'text-violet-400 border-violet-400/20 bg-violet-400/10';
      case 'agent-comm':
        return 'text-pink-400 border-pink-400/20 bg-pink-400/10';
      case 'memory-op':
        return 'text-teal-400 border-teal-400/20 bg-teal-400/10';
      case 'task-plan':
        return 'text-amber-400 border-amber-400/20 bg-amber-400/10';
      default:
        return 'text-gray-400 border-gray-400/20 bg-gray-400/10';
    }
  };

  const Icon = getIcon(thought.level);
  const colorClass = getTypeColor(thought.level);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`rounded-lg border p-4 ${colorClass}`}
      layout
    >
      <div className="flex items-start space-x-3">
        <motion.div
          animate={
            thought.level === 'execution' || thought.level === 'reasoning'
              ? {
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }
              : {}
          }
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="mt-0.5 flex-shrink-0"
        >
          <Icon className="w-5 h-5" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-x-2">
            <motion.span 
              className="text-sm font-medium capitalize truncate"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {thought.level}
              {thought.agentId && (
                <span className="ml-2 text-xs opacity-70">
                  Agent: {thought.agentId}
                </span>
              )}
            </motion.span>
            <span className="text-xs opacity-70 whitespace-nowrap">
              {formatDistanceToNow(thought.timestamp)} ago
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={thought.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2"
            >
              {thought.parentThoughtId && (
                <div className="flex items-center text-xs opacity-70 mb-2">
                  <ArrowRight className="w-3 h-3 mr-1" />
                  In response to: {thought.parentThoughtId}
                </div>
              )}
              <p className="text-sm">{thought.message}</p>
            </motion.div>
          </AnimatePresence>

          {thought.metadata && Object.keys(thought.metadata).length > 0 && (
            <motion.div 
              className="mt-2 text-xs space-y-1 opacity-70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {Object.entries(thought.metadata).map(([key, value]) => (
                <div key={key} className="flex items-center gap-x-2">
                  <span className="font-medium">{key}:</span>
                  <span className="truncate">
                    {typeof value === 'object' 
                      ? JSON.stringify(value)
                      : String(value)
                    }
                  </span>
                </div>
              ))}
            </motion.div>
          )}

          {(thought.taskId || thought.collaborationId) && (
            <motion.div 
              className="mt-2 flex flex-wrap gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {thought.taskId && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-700/50">
                  <List className="w-3 h-3 mr-1" />
                  Task: {thought.taskId}
                </span>
              )}
              {thought.collaborationId && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-700/50">
                  <Users className="w-3 h-3 mr-1" />
                  Collab: {thought.collaborationId}
                </span>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}