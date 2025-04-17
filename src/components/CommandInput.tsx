import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface CommandInputProps {
  readonly onSendMessage: (content: string) => void; // Corrected duplicate identifier
  readonly isProcessing: boolean;
}

export function CommandInput({ onSendMessage, isProcessing }: Readonly<CommandInputProps>) { // Mark props as read-only
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [isProcessing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-800 border-t border-gray-700">
      <div className="flex items-center bg-gray-900 rounded-lg border border-gray-700 focus-within:border-green-500 transition-colors">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)} // Add type for e
          className="flex-1 bg-transparent text-white px-4 py-2 focus:outline-none font-mono"
          placeholder={isProcessing ? 'Waiting for response...' : 'Enter a command...'}
          disabled={isProcessing}
        />
        <button
          type="submit"
          disabled={isProcessing || !input.trim()}
          className="p-2 text-green-400 hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send command" // Add aria-label
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
