import React from 'react';
import { Brain } from 'lucide-react';

export function AgentPanel() {
  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <Brain className="w-8 h-8 text-blue-400" />
          <h2 className="text-2xl font-bold">Agent One</h2>
        </div>
        <div className="space-y-6">
          <section className="card p-4">
            <h3 className="text-lg font-semibold mb-2">Status</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Active</span>
            </div>
          </section>
          <section className="card p-4">
            <h3 className="text-lg font-semibold mb-2">Memory Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Memories</span>
                <span className="text-blue-400">0</span>
              </div>
              <div className="flex justify-between">
                <span>Conversations</span>
                <span className="text-blue-400">0</span>
              </div>
              <div className="flex justify-between">
                <span>Learned Facts</span>
                <span className="text-blue-400">0</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}