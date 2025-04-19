import { Bot, Cpu } from 'lucide-react';
import { Button } from '../ui/Button';
import { Agent } from '../../hooks/useCanvas'; // Will be updated when useBench hook is created
import { Toast } from '../../hooks/useToast';

interface BenchAgentsListProps {
  readonly agents: Agent[];
  readonly addToast: (toast: Omit<Toast, 'id'>) => void;
}

export function BenchAgentsList({ agents, addToast }: BenchAgentsListProps) {
  return (
    <div className="p-4">
      <div className="bg-card rounded-lg border border-border shadow-md p-4">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Bot className="mr-2 h-5 w-5 text-primary" />
          Available Agents
        </h2>
        
        {agents.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="h-16 w-16 text-muted-foreground opacity-20 mx-auto mb-4" />
            <p className="text-lg font-medium">No Agents Available</p>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Agents haven't been registered yet. Check back later or create a new agent.
            </p>
            <Button
              variant="outline"
              className="mt-4"
            >
              Create New Agent
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {agents.map((_agent: Agent) => (
              <div key={_agent.id} className="bg-card/80 border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{_agent.name}</h3>
                    <p className="text-muted-foreground text-sm">Role: {_agent.role}</p>
                  </div>
                  <div className="flex space-x-1">
                    {_agent.capabilities.includes('mcp') && (
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full border border-primary/20 flex items-center">
                        <Cpu className="h-3 w-3 mr-1" />
                        MCP
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {_agent.capabilities.map((_capability: string) => (
                      <span 
                        key={_capability} 
                        className="px-2 py-0.5 bg-muted text-xs rounded-full"
                      >
                        {_capability}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.location.hash = '#';  // Navigate to chat
                      addToast({
                        type: 'info',
                        message: `Switch to chat and use /agent activate ${_agent.name}`,
                        duration: 5000
                      });
                    }}
                  >
                    Use in Chat
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
