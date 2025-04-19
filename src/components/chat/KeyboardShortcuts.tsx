import React from 'react';

export function KeyboardShortcuts() {
  return (
    <div className="max-w-4xl mx-auto mt-4">
      <div className="flex justify-center flex-wrap gap-3 text-xs text-muted-foreground">
        <div className="flex items-center">
          <kbd className="px-1 py-0.5 bg-muted rounded border border-border">Tab</kbd>
          <span className="ml-1">Autocomplete commands</span>
        </div>
        <div className="flex items-center">
          <kbd className="px-1 py-0.5 bg-muted rounded border border-border">/help</kbd>
          <span className="ml-1">Show all commands</span>
        </div>
        <div className="flex items-center">
          <kbd className="px-1 py-0.5 bg-muted rounded border border-border">/agent</kbd>
          <span className="ml-1">Toggle agent mode</span>
        </div>
      </div>
    </div>
  );
}
