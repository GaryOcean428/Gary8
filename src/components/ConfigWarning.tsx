import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function ConfigWarning() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full space-y-4">
        <div className="flex items-center space-x-2 text-yellow-500">
          <AlertTriangle className="w-6 h-6" />
          <h2 className="text-lg font-semibold">Configuration Required</h2>
        </div>
        <p className="text-muted-foreground">
          Please configure your API keys in the settings panel to continue. The following keys are required:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>X.AI API Key</li>
          <li>Groq API Key</li>
          <li>Perplexity API Key</li>
          <li>Hugging Face Token</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          You can find these settings in the settings panel. Click the gear icon in the sidebar to open settings.
        </p>
      </div>
    </div>
  );
}