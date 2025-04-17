import React from 'react';
import { Wrench } from 'lucide-react';
import { CompetitorAnalysis } from '../competitor-analysis/CompetitorAnalysis';

export function ToolsPanel() {
  const [activeTab, setActiveTab] = React.useState<'tools' | 'analysis'>('tools');

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="max-w-7xl mx-auto w-full">
        <div className="border-b border-gray-700">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('tools')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'tools'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Available Tools
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'analysis'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Competitor Analysis
            </button>
          </nav>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'tools' ? (
            <div className="space-y-6">
              <div className="flex items-center space-x-4 mb-6">
                <Wrench className="w-8 h-8 text-blue-400" />
                <h2 className="text-2xl font-bold">Available Tools</h2>
              </div>
              <div className="grid gap-4">
                {/* Tool cards */}
              </div>
            </div>
          ) : (
            <CompetitorAnalysis />
          )}
        </div>
      </div>
    </div>
  );
}