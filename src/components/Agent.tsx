import React, { useState } from 'react';
import { Brain } from 'lucide-react';

export function Agent() {
  const [temperature, setTemperature] = useState(0.5);

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTemperature(parseFloat(e.target.value));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">Agent Status</h1>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Agent Status Card */}
          <div className="bg-secondary rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-medium text-foreground/60">Status</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="font-medium">Active</span>
            </div>
          </div>

          {/* Memory Stats Card */}
          <div className="bg-secondary rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-medium text-foreground/60">Memory Usage</h3>
            <div className="text-2xl font-bold">0 KB</div>
          </div>

          {/* Task Stats Card */}
          <div className="bg-secondary rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-medium text-foreground/60">Tasks Completed</h3>
            <div className="text-2xl font-bold">0</div>
          </div>
        </div>

        {/* Agent Configuration */}
        <div className="bg-secondary rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Agent Configuration</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="default-model" className="block text-sm font-medium mb-1">Default Model</label>
              <select 
                id="default-model"
                className="w-full bg-background rounded-lg px-3 py-2"
                aria-label="Select default model"
              >
                <option>grok-beta</option>
                <option>llama-3.2-70b-preview</option>
                <option>llama-3.2-7b-preview</option>
              </select>
            </div>
            <div>
              <label htmlFor="temperature" className="block text-sm font-medium mb-1">Temperature</label>
              <input 
                id="temperature"
                type="range" 
                min={0}
                max={1}
                step={0.1}
                value={temperature}
                onChange={handleTemperatureChange}
                className="w-full"
                aria-label="Set temperature"
              />
              <div className="text-sm text-foreground/60 mt-1" aria-live="polite">
                Current temperature: {temperature.toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Message */}
        <div className="text-center text-foreground/60">
          More agent features coming soon
        </div>
      </div>
    </div>
  );
}
