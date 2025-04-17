import React from 'react';
import { Brain, Search, Lightbulb, CheckCircle, AlertCircle, RefreshCw, Code, Database, Zap, Users, MessageSquare, HardDrive, List } from 'lucide-react';
import { Thought, ThoughtType } from '../../lib/logging/thought-logger';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

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
        return Database;
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
      className={`rounded-lg border p-3 ${colorClass}`}
    >
      <div className="flex items-start space-x-3">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-x-2">
            <span className="text-sm font-medium capitalize truncate">
              {thought.level}
              {thought.agentId && (
                <span className="ml-2 text-xs opacity-70">
                  Agent: {thought.agentId}
                </span>
              )}
            </span>
            <span className="text-xs opacity-70 whitespace-nowrap">
              {formatDistanceToNow(thought.timestamp)} ago
            </span>
          </div>
          <p className="mt-1 text-sm opacity-90">{thought.message}</p>
          {thought.metadata && Object.keys(thought.metadata).length > 0 && (
            <div className="mt-2 text-xs space-y-1 opacity-70">
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
            </div>
          )}
          {(thought.taskId || thought.collaborationId) && (
            <div className="mt-2 flex items-center gap-2 text-xs opacity-70">
              {thought.taskId && (
                <span className="bg-gray-700/50 px-2 py-0.5 rounded">
                  Task: {thought.taskId}
                </span>
              )}
              {thought.collaborationId && (
                <span className="bg-gray-700/50 px-2 py-0.5 rounded">
                  Collab: {thought.collaborationId}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}