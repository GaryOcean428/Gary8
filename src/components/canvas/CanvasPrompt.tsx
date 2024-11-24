import React, { useState } from 'react';
import { Wand2 } from 'lucide-react';

interface CanvasPromptProps {
  onSubmit: (prompt: string) => Promise<void>;
  isGenerating: boolean;
}

export function CanvasPrompt({ onSubmit, isGenerating }: CanvasPromptProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    await onSubmit(prompt.trim());
    setPrompt('');
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-10">
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="relative">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the interface you want to create..."
            className="w-full bg-white rounded-lg pl-4 pr-12 py-3 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
            disabled={isGenerating}
            aria-label="Interface description"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:hover:text-blue-600"
            title="Generate interface"
            aria-label="Generate interface from description"
          >
            <Wand2 className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
