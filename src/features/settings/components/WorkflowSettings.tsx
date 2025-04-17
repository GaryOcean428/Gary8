import React from 'react';

export function WorkflowSettings() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-medium">Workflow Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure how the AI assistant processes and responds to your requests.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-2">Processing Mode</h4>
          <div className="space-y-3">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <input 
                  type="radio" 
                  id="singleStep" 
                  name="processingMode" 
                  className="h-4 w-4"
                  defaultChecked
                />
                <label htmlFor="singleStep" className="text-sm font-medium">
                  Single-step processing
                </label>
              </div>
              <p className="text-xs text-muted-foreground ml-6 mb-3">
                Process requests in a single step for faster responses
              </p>

              <div className="flex items-center space-x-2 mb-2">
                <input 
                  type="radio" 
                  id="multiStep" 
                  name="processingMode" 
                  className="h-4 w-4"
                />
                <label htmlFor="multiStep" className="text-sm font-medium">
                  Multi-step processing
                </label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Break down complex tasks into multiple steps for higher accuracy
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-2">Response Generation</h4>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <label htmlFor="maxTokens" className="text-sm font-medium">
                  Maximum response length
                </label>
                <p className="text-xs text-muted-foreground">
                  Maximum number of tokens in generated responses
                </p>
              </div>
              <div className="shrink-0">
                <select 
                  id="maxTokens" 
                  className="rounded border border-input bg-background px-3 py-1 text-sm"
                  defaultValue="2048"
                >
                  <option value="1024">1024 tokens</option>
                  <option value="2048">2048 tokens</option>
                  <option value="4096">4096 tokens</option>
                  <option value="8192">8192 tokens</option>
                </select>
              </div>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <label htmlFor="detailedThinking" className="text-sm font-medium">
                  Show detailed thinking
                </label>
                <p className="text-xs text-muted-foreground">
                  Display the AI's step-by-step reasoning process
                </p>
              </div>
              <div className="shrink-0">
                <input 
                  type="checkbox" 
                  id="detailedThinking" 
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-2">Tool Usage</h4>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <label htmlFor="autoUseTools" className="text-sm font-medium">
                  Automatic tool usage
                </label>
                <p className="text-xs text-muted-foreground">
                  Allow AI to automatically use tools when beneficial
                </p>
              </div>
              <div className="shrink-0">
                <input 
                  type="checkbox" 
                  id="autoUseTools" 
                  className="h-4 w-4 rounded border-gray-300"
                  defaultChecked
                />
              </div>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <label htmlFor="confirmToolUsage" className="text-sm font-medium">
                  Confirm tool usage
                </label>
                <p className="text-xs text-muted-foreground">
                  Request confirmation before using tools
                </p>
              </div>
              <div className="shrink-0">
                <input 
                  type="checkbox" 
                  id="confirmToolUsage" 
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}