import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Terminal, User } from 'lucide-react';
import { ProgressiveMessage } from '../ProgressiveMessage';
import ReactMarkdown from 'react-markdown';
import { Agent } from '../../types';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
}

interface ChatMessageProps {
  message: Message;
  isProcessing: boolean;
  processingPhase: string;
  availableAgents: Agent[];
  activeAgent: string | null;
}

export function ChatMessage({
  message,
  isProcessing,
  processingPhase,
  availableAgents,
  activeAgent
}: ChatMessageProps) {
  // Helper to render message bubble classes
  const getBubbleClasses = (_role: Message['role']) => {
    if (_role === 'user') return 'bg-secondary/90 text-secondary-foreground rounded-l-lg rounded-tr-lg card-elevated';
    if (_role === 'system') return 'bg-destructive/90 text-destructive-foreground rounded-lg card-elevated glow-destructive';
    return 'bg-card/90 text-card-foreground rounded-r-lg rounded-tl-lg card-elevated';
  };

  // Helper to render message role icon and name
  const renderRoleInfo = (_role: Message['role']) => {
    if (_role === 'user') {
      return <div className="flex items-center text-xs text-secondary-foreground/70"><User className="w-3 h-3 mr-1" /> User</div>;
    }
    if (_role === 'system') {
      return <div className="flex items-center text-xs text-destructive-foreground/70"><Terminal className="w-3 h-3 mr-1" /> System</div>;
    }
    if (activeAgent) {
      const agentName = availableAgents.find((_a: Agent) => _a.id === activeAgent)?.name ?? 'Assistant';
      return <div className="flex items-center text-xs text-primary/70"><Bot className="w-3 h-3 mr-1" /> {agentName}</div>;
    }
    return <div className="flex items-center text-xs text-card-foreground/70"><Bot className="w-3 h-3 mr-1" /> Assistant</div>;
  };

  const bubbleClass = getBubbleClasses(message.role);
  const streamingClass = (message.role === 'assistant' && message.content === '' && isProcessing) 
    ? `streaming-cursor streaming-cursor-${processingPhase}` 
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[95%] sm:max-w-[80%] rounded-lg p-4 shadow-lg backdrop-blur-sm ${bubbleClass} ${streamingClass}`}>
        {renderRoleInfo(message.role)}
        {message.role === 'assistant' && message.content.length > 0 ? (
          <ProgressiveMessage 
            content={message.content} 
            isLoading={isProcessing && message.content === ''} 
            streamingPhase={processingPhase} 
            className="prose prose-invert max-w-none break-words" 
          />
        ) : (
          <div className="prose prose-invert max-w-none break-words">
            <ReactMarkdown>{String(message.content ?? '')}</ReactMarkdown>
          </div>
        )}
        {message.model && (
          <div className="mt-2 text-xs text-muted-foreground flex gap-1 items-center">
            <span className="badge badge-primary">{message.model}</span>
            <span className="text-muted-foreground">{new Date(message.timestamp).toLocaleTimeString()}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
