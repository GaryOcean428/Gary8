import React from 'react';

interface WelcomeContentProps {
  setInput: (value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export function WelcomeContent({ setInput, textareaRef }: WelcomeContentProps) {
  const suggestions = [
    "What's the latest in quantum computing?",
    "Analyze the trends in renewable energy adoption",
    "Generate a React component for a dynamic form",
    "How can I optimize my SQLite database queries?"
  ];

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md p-8 card-glass card-elevated">
        <h2 className="text-2xl font-bold mb-4">Gary8</h2>
        <p className="text-muted-foreground mb-6">
          Ask me anything - I can search the web, analyze data, generate code, and more.
        </p>
        <div className="grid grid-cols-1 gap-3 text-left text-sm">
          {suggestions.map((_suggestion, _i) => (
            <button
              key={_i}
              className="p-3 text-left rounded-lg bg-muted hover:bg-accent/20 transition-colors"
              onClick={() => { 
                setInput(_suggestion); 
                textareaRef.current?.focus(); 
              }}
            >
              {_suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
