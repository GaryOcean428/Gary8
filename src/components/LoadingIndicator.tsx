import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Search, Code, Calculator, Clock, Database, Loader } from 'lucide-react';

export type ProcessingState = 
  | 'thinking' 
  | 'searching' 
  | 'coding' 
  | 'analyzing'
  | 'reasoning'
  | 'retrieving'
  | 'synthesizing'
  | 'generating'
  | undefined;

interface LoadingIndicatorProps {
  state: ProcessingState;
}

export function LoadingIndicator({ state }: LoadingIndicatorProps) {
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
      case 'generating':
        return Loader;
      default:
        return Brain;
    }
  };

  const getMessage = () => {
    switch (state) {
      case 'thinking':
        return 'Thinking...';
      case 'searching':
        return 'Searching for information...';
      case 'coding':
        return 'Writing code...';
      case 'analyzing':
        return 'Analyzing data...';
      case 'reasoning':
        return 'Reasoning about the problem...';
      case 'retrieving':
        return 'Retrieving from memory...';
      case 'synthesizing':
        return 'Synthesizing results...';
      case 'generating':
        return 'Generating response...';
      default:
        return 'Processing...';
    }
  };
  
  const getStateColor = () => {
    switch (state) {
      case 'thinking':
        return 'text-primary';
      case 'searching':
        return 'text-warning';
      case 'coding':
        return 'text-secondary';
      case 'analyzing':
        return 'text-accent';
      case 'reasoning':
        return 'text-secondary';
      case 'retrieving':
        return 'text-accent';
      case 'synthesizing':
      case 'generating':
        return 'text-primary';
      default:
        return 'text-primary';
    }
  };

  const Icon = getIcon();
  const stateColor = getStateColor();

  const pulse = {
    scale: [1, 1.1, 1],
    opacity: [0.7, 1, 0.7],
    transition: { 
      duration: 2, 
      repeat: Infinity,
      ease: "easeInOut" 
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <motion.div animate={pulse} className={`${stateColor}`}>
        <Icon className="w-5 h-5" />
      </motion.div>
      <span className="text-sm font-medium">{getMessage()}</span>
    </div>
  );
}