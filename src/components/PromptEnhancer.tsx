import React from 'react';

interface PromptEnhancerProps {
  onEnhance: (enhancement: string) => void;
  activeEnhancement: string | null;
}

export function PromptEnhancer({ onEnhance, activeEnhancement }: PromptEnhancerProps) {
  const enhancements = [
    {
      name: 'Detailed Reasoning',
      prompt: 'Please provide detailed step-by-step reasoning for your response.'
    },
    {
      name: 'Multiple Approaches',
      prompt: 'Consider multiple approaches and explain the pros and cons of each.'
    },
    {
      name: 'Self-Reflection',
      prompt: 'After providing your response, please reflect on your reasoning and consider potential improvements.'
    },
    {
      name: 'Verification Steps',
      prompt: 'Include steps to verify the correctness of your solution.'
    }
  ];

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden w-64">
      {enhancements.map((_enhancement) => (
        <button
          key={_enhancement.name}
          onClick={() => onEnhance(_enhancement.prompt)}
          className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors ${
            activeEnhancement === _enhancement.prompt ? 'bg-gray-700' : ''
          }`}
        >
          {_enhancement.name}
        </button>
      ))}
    </div>
  );
}