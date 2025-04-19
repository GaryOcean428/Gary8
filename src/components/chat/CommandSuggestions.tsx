import React from 'react';

interface CommandSuggestionsProps {
  input: string;
  setInput: (value: string) => void;
}

export function CommandSuggestions({ input, setInput }: CommandSuggestionsProps) {
  // Only show suggestions when the input starts with a slash but doesn't have a space yet
  const showSuggestions = input.startsWith('/') && !input.includes(' ');

  // Define available commands
  const commands = [
    { command: '/agent', description: 'Toggle agent mode or run agent commands' },
    { command: '/sandbox', description: 'Toggle code sandbox or set sandbox language' },
    { command: '/clear', description: 'Clear all messages in the current chat' },
    { command: '/help', description: 'Show available commands and help' }
  ];

  // Filter commands based on what's already typed
  const filteredCommands = commands.filter(_item => 
    _item.command.startsWith(input)
  );

  if (!showSuggestions || filteredCommands.length === 0) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto mt-1">
      <div className="bg-card rounded-lg border border-border shadow-lg">
        <div className="p-2 border-b border-border">
          <div className="text-xs text-muted-foreground">Commands</div>
        </div>
        <div className="max-h-48 overflow-y-auto">
          {filteredCommands.map(_item => (
            <button 
              key={_item.command} 
              className={`w-full text-left p-2 hover:bg-muted ${
                input === _item.command ? 'bg-muted' : ''
              }`} 
              onClick={() => setInput(_item.command + ' ')}
            >
              <div className="flex items-center">
                <code className="bg-muted/50 px-1 py-0.5 rounded text-primary">
                  {_item.command}
                </code>
                <span className="ml-2 text-sm text-muted-foreground">
                  {_item.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
