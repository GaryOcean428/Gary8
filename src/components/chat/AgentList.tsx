import React from 'react';
import { Bot, X } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Agent } from '../../types';

interface AgentListProps {
  availableAgents: Agent[];
  activeAgent: string | null;
  activateAgent: (agentId: string) => void;
  closeAgentList: () => void;
}

export function AgentList({
  availableAgents, 
  activeAgent,
  activateAgent,
  closeAgentList
}: AgentListProps) {
  return (
    <div className="mt-8 max-w-md mx-auto">
      <div className="rounded-lg p-4 bg-card/50 backdrop-blur-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h3 className="font-medium">Available Agents</h3>
          </div>
          <button 
            className="text-muted-foreground hover:text-foreground" 
            onClick={closeAgentList} 
            aria-label="Close agent list"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {availableAgents.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p>No agents available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {availableAgents.map((_agent: Agent) => (
              <button
                key={_agent.id}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                  activeAgent === _agent.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card hover:bg-muted'
                }`}
                onClick={() => activateAgent(_agent.id)}
              >
                <div>
                  <div className="font-medium">{_agent.name}</div>
                  <div className="text-xs opacity-80">Role: {_agent.role}</div>
                </div>
                <div>
                  {_agent.capabilities.includes('mcp') ? (
                    <Badge variant="secondary" className="text-xs">MCP</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Standard</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Activate with <code className="bg-muted px-1 py-0.5 rounded">/agent activate [name]</code></p>
        </div>
      </div>
    </div>
  );
}
