import React, { useRef, useEffect } from 'react';
import { Filter, Hash, Pause, Play, RotateCcw, Send, Share2, Sparkles } from 'lucide-react';
import { SaveChatButton } from '../SaveChatButton';
import { Message } from './ChatMessage';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  isProcessing: boolean;
  isPaused: boolean;
  setIsPaused: (value: boolean) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleReset: () => void;
  showFilterMenu: boolean;
  setShowFilterMenu: (value: boolean) => void;
  messages: Message[];
  setAutoScroll: (value: boolean) => void;
}

export function ChatInput({
  input,
  setInput,
  isProcessing,
  isPaused,
  setIsPaused,
  handleSubmit,
  handleReset,
  showFilterMenu,
  setShowFilterMenu,
  messages,
  setAutoScroll
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      // Set height based on scroll height, capped at 200px
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`; 
    }
  }, [input]);

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex flex-col sm:flex-row items-end gap-2">
      <div className="flex gap-2">
        <div className="relative">
          <button 
            type="button" 
            onClick={() => setShowFilterMenu(!showFilterMenu)} 
            className={`p-3 rounded-lg transition-colors text-secondary hover:text-secondary-foreground hover:bg-secondary/10`} 
            title="Filters" 
            aria-label="Show Filters"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
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
          aria-label={isPaused ? 'Resume processing' : 'Pause processing'}
        >
          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </button>
        <button 
          type="button" 
          onClick={handleReset} 
          className="hidden sm:flex p-3 rounded-lg transition-colors text-muted-foreground hover:text-destructive-foreground hover:bg-destructive/10" 
          title="New Chat" 
          aria-label="Start New Chat"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <div className="relative">
          <button 
            type="button" 
            className="hidden sm:flex p-3 rounded-lg transition-colors text-muted-foreground hover:text-primary hover:bg-primary/10" 
            title="Commands" 
            aria-label="Show Commands" 
            onClick={() => { 
              setInput(input.startsWith('/') ? '' : '/'); 
              textareaRef.current?.focus(); 
            }}
          >
            <Hash className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative w-full">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(_e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(_e.target.value)}
          onKeyDown={(_e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (_e.key === 'Enter' && !_e.shiftKey) { 
              _e.preventDefault(); 
              handleSubmit(_e); 
            }
            if (_e.key === 'Tab' && input.startsWith('/') && !input.includes(' ')) {
              _e.preventDefault();
              const commands = ['/agent', '/sandbox', '/clear', '/help'];
              const matchingCommands = commands.filter(_cmd => _cmd.startsWith(input));
              if (matchingCommands.length === 1) setInput(matchingCommands[0] + ' ');
            }
          }}
          placeholder={isProcessing ? 'Processing...' : 'Send a message or type / for commands...'}
          className="chat-textarea w-full bg-input text-foreground rounded-lg pl-4 pr-12 py-3 resize-none min-h-[48px] max-h-[200px] border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all focus-glow" 
          disabled={isProcessing}
          rows={1}
        />
        <button 
          type="button" 
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-accent rounded-lg transition-colors" 
          title="AI Suggestions" 
          aria-label="AI Suggestions"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex gap-2">
        <button 
          type="submit" 
          disabled={!input.trim() || isProcessing} 
          className="flex-none p-3 text-primary hover:text-primary-foreground hover:bg-primary/20 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent" 
          aria-label="Send message"
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
            aria-label="Share chat"
            onClick={() => setAutoScroll(true)}
          >
            <Share2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </form>
  );
}
