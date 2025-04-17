import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { PromptEnhancer } from './PromptEnhancer';
import { Send, PauseCircle, PlayCircle, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface TerminalProps {
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  isProcessing: boolean;
  isPaused: boolean;
  onPauseToggle: () => void;
}

export default function Terminal({ 
  messages, 
  onSendMessage, 
  isProcessing,
  isPaused,
  onPauseToggle
}: TerminalProps) {
  const [input, setInput] = useState('');
  const [showEnhancer, setShowEnhancer] = useState(false);
  const [activeEnhancement, setActiveEnhancement] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    try {
      const message = input.trim();
      setInput('');
      setShowEnhancer(false);
      await onSendMessage(activeEnhancement ? `${message}\n\n${activeEnhancement}` : message);
      setActiveEnhancement(null);
      if (inputRef.current) {
        inputRef.current.style.height = '48px';
      }
    } catch (error) {
      console.error('Failed to process message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEnhance = (enhancement: string) => {
    setActiveEnhancement(enhancement);
    setShowEnhancer(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message-container ${
              message.role === 'user' ? 'user-container' : 'ai-container'
            }`}
          >
            <div className={`message ${
              message.role === 'user' ? 'message-user' : 'message-ai'
            } p-4`}>
              <div className="flex items-start">
                <span className="font-mono text-sm text-gray-400 mr-2">
                  {message.role === 'user' ? '>' : '#'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  {message.role === 'assistant' && message.model && (
                    <div className="text-xs text-gray-500 mt-2">{message.model}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-800 bg-gray-900 p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-4">
          <button
            type="button"
            onClick={onPauseToggle}
            className={`flex-none w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              isPaused
                ? 'text-green-400 hover:text-green-300 hover:bg-gray-800'
                : 'text-yellow-400 hover:text-yellow-300 hover:bg-gray-800'
            }`}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? 
              <PlayCircle className="w-6 h-6" /> : 
              <PauseCircle className="w-6 h-6" />
            }
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-gray-800 text-gray-100 rounded-lg p-3 pr-12 resize-none min-h-[48px] max-h-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={isProcessing ? 'Processing...' : 'Enter a message...'}
              disabled={isProcessing}
              rows={1}
              style={{ height: '48px', lineHeight: '24px' }}
            />
            <button
              type="button"
              onClick={() => setShowEnhancer(!showEnhancer)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${
                activeEnhancement 
                  ? 'text-blue-400 hover:text-blue-300'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title={activeEnhancement ? 'Enhancement active' : 'Enhance prompt'}
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="flex-none w-10 h-10 flex items-center justify-center rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {showEnhancer && (
          <div className="absolute bottom-20 right-4">
            <PromptEnhancer 
              onEnhance={handleEnhance}
              activeEnhancement={activeEnhancement}
            />
          </div>
        )}
      </div>
    </div>
  );
}