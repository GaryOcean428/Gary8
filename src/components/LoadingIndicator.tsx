import React from 'react';
import { Brain, Search, Code, Calculator, Clock, Database, Sparkles, RefreshCw, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ProcessingState = 
  | 'thinking'
  | 'searching'
  | 'coding'
  | 'analyzing'
  | 'reasoning'
  | 'retrieving'
  | 'synthesizing'
  | 'planning'
  | undefined;

interface LoadingIndicatorProps {
  state: ProcessingState;
  subText?: string;
}

export function LoadingIndicator({ state, subText }: LoadingIndicatorProps) {
  if (!state) return null;

  const getIcon = () => {
    switch (state) {
      case 'thinking':
        return Brain;
      case 'searching':
        return Search;
      case 'coding':
        return Code;
      case 'analyzing':
        return Calculator;
      case 'reasoning':
        return Clock;
      case 'retrieving':
        return Database;
      case 'synthesizing':
        return Sparkles;
      case 'planning':
        return RefreshCw;
      default:
        return Zap;
    }
  };

  const getMessage = () => {
    switch (state) {
      case 'thinking':
        return 'Analyzing request...';
      case 'searching':
        return 'Searching for information...';
      case 'coding':
        return 'Generating code...';
      case 'analyzing':
        return 'Analyzing data...';
      case 'reasoning':
        return 'Reasoning about the problem...';
      case 'retrieving':
        return 'Retrieving from memory...';
      case 'synthesizing':
        return 'Synthesizing results...';
      case 'planning':
        return 'Planning next steps...';
      default:
        return 'Processing...';
    }
  };

  const Icon = getIcon();

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex flex-col items-center space-y-4 p-6 bg-gray-800/50 rounded-lg backdrop-blur-sm border border-gray-700/50"
      >
        {/* Icon Animation */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: state === 'thinking' ? [0, 360] : 0
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative"
        >
          <Icon className="w-8 h-8 text-blue-400" />
          
          {/* Orbital Particles */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            {[0, 120, 240].map((degree, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-blue-400 rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `rotate(${degree}deg) translateX(20px)`
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.5
                }}
              />
            ))}
          </motion.div>
        </motion.div>

        {/* Message */}
        <div className="text-center space-y-2">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="font-medium"
          >
            {getMessage()}
          </motion.div>
          
          {subText && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-gray-400"
            >
              {subText}
            </motion.div>
          )}
        </div>

        {/* Progress Bar */}
        <motion.div 
          className="w-48 h-1 bg-gray-700 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="h-full bg-blue-500"
            animate={{
              x: ["-100%", "100%"]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}