import React, { useState } from 'react';
import { Wrench, Search, Code, Database, FileText, Zap } from 'lucide-react';
import { CompetitorAnalysis } from '../competitor-analysis/CompetitorAnalysis';
import { toolRegistry } from '../../lib/tools/tool-registry';

export function ToolsPanel() {
  const [activeTab, setActiveTab] = useState<'tools' | 'analysis'>('tools');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const tools = toolRegistry.getTools();
  const toolCategories = {
    'Data Processing': tools.filter(t => t.name.includes('data') || t.name.includes('process')),
    'Search & Analysis': tools.filter(t => t.name.includes('search') || t.name.includes('analyze')),
    'Code & Development': tools.filter(t => t.name.includes('code') || t.name.includes('git')),
    'Export & Import': tools.filter(t => t.name.includes('export') || t.name.includes('import'))
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="border-b border-border">
        <nav className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('tools')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'tools'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Available Tools
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'analysis'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Competitor Analysis
            </button>
          </div>
        </nav>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'tools' ? (
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-4 mb-6">
              <Wrench className="w-8 h-8 text-primary" />
              <div>
                <h2 className="text-2xl font-bold">Tools & Utilities</h2>
                <p className="text-muted-foreground">
                  Powerful tools to enhance your workflow
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(toolCategories).map(([category, tools]) => (
                <div key={category} className="card p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    {category === 'Data Processing' && <Database className="w-5 h-5" />}
                    {category === 'Search & Analysis' && <Search className="w-5 h-5" />}
                    {category === 'Code & Development' && <Code className="w-5 h-5" />}
                    {category === 'Export & Import' && <FileText className="w-5 h-5" />}
                    <span>{category}</span>
                  </h3>
                  <div className="space-y-3">
                    {tools.map(tool => (
                      <button
                        key={tool.name}
                        onClick={() => setSelectedTool(tool.name)}
                        className={`w-full p-3 rounded-lg transition-colors text-left ${
                          selectedTool === tool.name
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{tool.name}</span>
                          <Zap className="w-4 h-4 opacity-50" />
                        </div>
                        <p className="text-sm mt-1 opacity-80">
                          {tool.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {selectedTool && (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-card max-w-2xl w-full rounded-lg shadow-lg border border-border p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {tools.find(t => t.name === selectedTool)?.name}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {tools.find(t => t.name === selectedTool)?.description}
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setSelectedTool(null)}
                      className="px-4 py-2 text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        // Execute tool
                        setSelectedTool(null);
                      }}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                      Execute Tool
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <CompetitorAnalysis />
        )}
      </div>
    </div>
  );
}