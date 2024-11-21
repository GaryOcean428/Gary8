import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Pause, Play, Settings } from 'lucide-react';
import { agentSystem } from '../lib/agent-system';
import { useToast } from '../hooks/useToast';
import { cn } from '../lib/utils';
import { ScrollArea } from './ui/ScrollArea';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { Tooltip } from './ui/Tooltip';
import { LoadingIndicator, ProcessingState } from './LoadingIndicator';
import { MarkdownContent } from './MarkdownContent';
import { useSettings } from '../context/SettingsContext';

export function Chat() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [processingState, setProcessingState] = useState<ProcessingState>();
  const [processingSubText, setProcessingSubText] = useState<string>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();
  const { setSettingsPanelOpen } = useStore();
  const [autoScroll, setAutoScroll] = useState(true);
  const { settings } = useSettings();
  const [isSettingsHovered, setIsSettingsHovered] = useState(false);

  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const isScrolledToBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    setAutoScroll(isScrolledToBottom);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = { role: 'user' as const, content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      let assistantMessage = { role: 'assistant' as const, content: '' };
      setMessages(prev => [...prev, assistantMessage]);

      await agentSystem.processMessage(
        userMessage.content,
        (content) => {
          if (!isPaused) {
            assistantMessage.content += content;
            setMessages(prev => [
              ...prev.slice(0, -1),
              { ...assistantMessage }
            ]);
          }
        },
        (state) => {
          setProcessingState(state as ProcessingState);
          switch (state) {
            case 'thinking':
              setProcessingSubText('Analyzing request...');
              break;
            case 'searching':
              setProcessingSubText('Gathering information...');
              break;
            case 'reasoning':
              setProcessingSubText('Formulating response...');
              break;
            case 'synthesizing':
              setProcessingSubText('Combining results...');
              break;
            default:
              setProcessingSubText(undefined);
          }
        }
      );
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      setIsProcessing(false);
      setProcessingState(undefined);
      setProcessingSubText(undefined);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className="flex-none flex items-center justify-between p-4 border-b border-border bg-background/50 backdrop-blur-sm">
        <h1 className="text-lg font-semibold">Chat</h1>
        <div className="flex items-center gap-2">
          <Tooltip content={isPaused ? 'Resume' : 'Pause'}>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isPaused ? 'text-green-400 hover:bg-green-400/10' : 'text-yellow-400 hover:bg-yellow-400/10'
              )}
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
          </Tooltip>
          <Tooltip content="Settings">
            <button
              onClick={() => setSettingsPanelOpen(true)}
              onMouseEnter={() => setIsSettingsHovered(true)}
              onMouseLeave={() => setIsSettingsHovered(false)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isSettingsHovered || settings.theme === 'dark'
                  ? 'text-primary hover:bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <Settings className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" onScroll={handleScroll}>
        <div className="p-4 space-y-4 max-w-5xl mx-auto">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                  'max-w-[85%] rounded-lg p-4',
                  message.role === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                {isProcessing && index === messages.length - 1 ? (
                  <LoadingIndicator 
                    state={processingState} 
                    subText={processingSubText}
                  />
                ) : (
                  <MarkdownContent content={message.content} />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* New Messages Button */}
      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="absolute bottom-24 right-8 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        >
          ↓ New messages
        </button>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex-none p-4 border-t border-border bg-background/50 backdrop-blur-sm">
        <div className="relative flex items-end gap-2 max-w-5xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={isProcessing ? 'Processing...' : 'Type a message...'}
              disabled={isProcessing}
              className="w-full bg-secondary rounded-lg pl-4 pr-12 py-3 min-h-[48px] max-h-[200px] resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={1}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-foreground/60 hover:text-foreground rounded-lg transition-colors"
              title="AI Suggestions"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="flex-none p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}