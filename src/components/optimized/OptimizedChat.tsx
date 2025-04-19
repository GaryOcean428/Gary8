import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Pause, Play, Sparkles, RotateCcw, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AgentSystem } from '../../lib/agent-system';
import { LoadingIndicator } from '../LoadingIndicator';
import { useChat } from '../../hooks/useChat';
import { thoughtLogger } from '../../lib/logging/thought-logger';
import { SaveChatButton } from '../SaveChatButton';
import { useInView } from '../../hooks/useInView';
import { ProgressiveMessage } from '../ProgressiveMessage';
import { performanceMonitor } from '../../lib/utils/PerformanceMonitor';
import { useThrottledCallback } from 'use-debounce';

type ProcessingPhase = 'thinking' | 'searching' | 'processing' | 'generating';

export function OptimizedChat() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [processingPhase, setProcessingPhase] = useState<ProcessingPhase>('thinking');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isInView, ref: visibilityRef } = useInView({ threshold: 0.1 });
  
  const { messages, addMessage, currentChatId, saveChat, clearMessages } = useChat();
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Throttled scroll handler to improve performance
  const handleScroll = useThrottledCallback(() => {
    if (!chatContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isScrolledToBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 30;
    setAutoScroll(isScrolledToBottom);
  }, 100, { leading: true, trailing: true });

  // Auto-scroll to bottom when messages change if autoScroll is true
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      const performScroll = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      };
      
      const timeoutId = setTimeout(performScroll, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, autoScroll]);

  // Update processing phase based on agent state
  const updateProcessingPhase = useCallback((_state?: string) => {
    if (!_state) return;
    
    switch (_state) {
      case 'searching':
        setProcessingPhase('searching');
        break;
      case 'retrieving':
      case 'processing':
        setProcessingPhase('processing');
        break;
      case 'thinking':
      case 'reasoning':
        setProcessingPhase('thinking');
        break;
      default:
        setProcessingPhase('generating');
    }
  }, []);

  const handleSubmit = async (_e: React.FormEvent) => {
    _e.preventDefault();
    if (!input.trim() || isProcessing) return;

    performanceMonitor.startMeasure('message_processing', {
      inputLength: input.length,
      messageCount: messages.length
    });

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    setInput('');
    setIsProcessing(true);
    setProcessingPhase('thinking');
    setAutoScroll(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
    }

    try {
      thoughtLogger.log('execution', 'Processing user message');
      
      await addMessage(userMessage);

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      };

      await addMessage(assistantMessage);

      let currentContent = '';
      let startTime = Date.now();
      let chunkCount = 0;

      const system = AgentSystem.getInstance();
      await system.processMessage(
        userMessage.content,
        (_content) => {
          if (!isPaused) {
            currentContent += _content;
            chunkCount++;
            
            // Throttle UI updates based on visibility and update size
            const shouldUpdate = isInView || chunkCount % 5 === 0;
            
            if (shouldUpdate) {
              addMessage(_messages => {
                const lastMessage = _messages[_messages.length - 1];
                if (lastMessage && lastMessage.role === 'assistant') {
                  return _messages.map(_msg => 
                    _msg.id === assistantMessage.id
                      ? { ..._msg, content: currentContent }
                      : _msg
                  );
                }
                return _messages;
              });
            }
          }
        },
        updateProcessingPhase
      );

      if (!currentChatId) {
        await saveChat('New Chat');
      }

      // Log streaming performance metrics
      performanceMonitor.measureStreamingPerformance({
        streamDuration: Date.now() - startTime,
        contentSize: currentContent.length,
        chunkCount,
        avgChunkSize: currentContent.length / Math.max(1, chunkCount),
        windowWidth: window.innerWidth,
      });

      thoughtLogger.log('success', 'Message processed successfully');
    } catch (error) {
      thoughtLogger.log('error', 'Failed to process message', { error });
      
      await addMessage({
        id: crypto.randomUUID(),
        role: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      });
    } finally {
      setIsProcessing(false);
      setProcessingPhase('thinking');
      performanceMonitor.endMeasure('message_processing');
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear the current conversation?')) {
      clearMessages();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full pt-0 lg:pt-4" ref={visibilityRef}>
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 space-y-4 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md p-8 card-glass card-elevated">
              <h2 className="text-2xl font-bold mb-4">Gary8</h2>
              <p className="text-muted-foreground mb-6">
                Ask me anything - I can search the web, analyze data, generate code, and more.
              </p>
              <div className="grid grid-cols-1 gap-3 text-left text-sm">
                {[
                  "What's the latest in quantum computing?",
                  "Analyze the trends in renewable energy adoption",
                  "Generate a React component for a dynamic form",
                  "How can I optimize my SQLite database queries?"
                ].map((_suggestion, _i) => (
                  <button
                    key={_i}
                    className="p-3 text-left rounded-lg bg-muted hover:bg-accent/20 transition-colors"
                    onClick={() => {
                      setInput(_suggestion);
                      if (textareaRef.current) {
                        textareaRef.current.focus();
                      }
                    }}
                  >
                    {_suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((_message) => (
          <div
            key={_message.id}
            className={`flex ${
              _message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[95%] sm:max-w-[80%] rounded-lg p-4 shadow-lg backdrop-blur-sm ${
                _message.role === 'user'
                  ? 'bg-secondary/90 text-secondary-foreground rounded-l-lg rounded-tr-lg card-elevated'
                  : _message.role === 'system'
                  ? 'bg-destructive/90 text-destructive-foreground rounded-lg card-elevated glow-destructive'
                  : 'bg-card/90 text-card-foreground rounded-r-lg rounded-tl-lg card-elevated'
              } ${
                _message.role === 'assistant' && _message.content === '' && isProcessing
                  ? 'streaming-cursor streaming-cursor-' + processingPhase
                  : ''
              }`}
            >
              {_message.role === 'assistant' ? (
                <ProgressiveMessage 
                  content={_message.content || ''} 
                  isLoading={isProcessing && _message.content === ''}
                  streamingPhase={processingPhase}
                  className="prose prose-invert max-w-none break-words"
                />
              ) : (
                <div className="prose prose-invert max-w-none break-words">
                  <ReactMarkdown>{String(_message.content || '')}</ReactMarkdown>
                </div>
              )}
              
              {_message.model && (
                <div className="mt-2 text-xs text-muted-foreground flex gap-1 items-center">
                  <span className="badge badge-primary">{_message.model}</span>
                  <span className="text-muted-foreground">{new Date(_message.timestamp).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isProcessing && !messages.some(_m => _m.role === 'assistant' && _m.content === '') && (
          <div className="flex justify-start">
            <div className="bg-card backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <LoadingIndicator state={processingPhase} />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border backdrop-blur-sm bg-background/50">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex flex-col sm:flex-row items-end gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className={`hidden sm:flex p-3 rounded-lg transition-colors ${
                isPaused 
                  ? 'text-success hover:text-success-foreground hover:bg-success/10' 
                  : 'text-warning hover:text-warning-foreground hover:bg-warning/10'
              }`}
              title={isPaused ? 'Resume' : 'Pause'}
              disabled={!isProcessing}
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="hidden sm:flex p-3 rounded-lg transition-colors text-muted-foreground hover:text-destructive-foreground hover:bg-destructive/10"
              title="New Chat"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 relative w-full">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(_e) => setInput(_e.target.value)}
              onKeyDown={(_e) => {
                if (_e.key === 'Enter' && !_e.shiftKey) {
                  _e.preventDefault();
                  handleSubmit(_e);
                }
              }}
              placeholder={isProcessing ? 'Processing...' : 'Send a message...'}
              className="w-full bg-input text-foreground rounded-lg pl-4 pr-12 py-3 resize-none min-h-[48px] max-h-[200px] border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all focus-glow"
              disabled={isProcessing}
              rows={1}
              style={{ height: '48px' }}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-accent rounded-lg transition-colors"
              title="AI Suggestions"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="flex-none p-3 text-primary hover:text-primary-foreground hover:bg-primary/20 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <Send className="w-5 h-5" />
            </button>
            
            {messages.length > 0 && (
              <SaveChatButton messages={messages} />
            )}
            
            {messages.length > 0 && (
              <button
                type="button"
                className="flex-none p-3 text-primary hover:text-primary-foreground hover:bg-primary/20 rounded-lg transition-colors"
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>
      </div>

      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="fixed bottom-24 right-8 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors glow-primary"
        >
          ↓ New messages
        </button>
      )}
    </div>
  );
}