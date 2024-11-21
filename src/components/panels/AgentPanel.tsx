import React from 'react';
import { Brain, Activity, Database, Code, Users } from 'lucide-react';
import { useStore } from '../../store';
import { agentSystem } from '../../lib/agents/agent-system';
import { thoughtLogger } from '../../lib/logging/thought-logger';
import { useToast } from '../../hooks/useToast';

export function AgentPanel() {
  const [agentStats, setAgentStats] = React.useState({
    activeAgents: 0,
    completedTasks: 0,
    averageResponseTime: 0,
    memoryUsage: 0
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const { addToast } = useToast();

  React.useEffect(() => {
    const fetchAgentStats = async () => {
      try {
        // Initialize agent system if needed
        if (!agentSystem.isInitialized) {
          await agentSystem.initialize();
        }

        const agents = agentSystem.getAgents();
        const stats = {
          activeAgents: agents.filter(a => a.getState().status === 'active').length,
          completedTasks: agents.reduce((sum, a) => sum + a.getState().metrics.tasksCompleted, 0),
          averageResponseTime: agents.reduce((sum, a) => sum + a.getState().metrics.averageResponseTime, 0) / Math.max(agents.length, 1),
          memoryUsage: await thoughtLogger.getMemoryUsage()
        };
        setAgentStats(stats);
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Failed to fetch agent stats',
          message: error instanceof Error ? error.message : 'An unknown error occurred'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgentStats();
    const interval = setInterval(fetchAgentStats, 5000);
    return () => clearInterval(interval);
  }, [addToast]);

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Agent System</h1>
            <p className="text-muted-foreground mt-1">Monitor and manage agent activities</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400' : 'bg-green-400'}`} />
            <span className="text-sm text-muted-foreground">
              {isLoading ? 'Updating...' : 'System Online'}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            label="Active Agents"
            value={agentStats.activeAgents}
            trend={0}
          />
          <StatCard
            icon={Activity}
            label="Tasks Completed"
            value={agentStats.completedTasks}
            trend={0}
          />
          <StatCard
            icon={Code}
            label="Avg Response Time"
            value={`${agentStats.averageResponseTime.toFixed(2)}ms`}
            trend={0}
          />
          <StatCard
            icon={Database}
            label="Memory Usage"
            value={`${(agentStats.memoryUsage / 1024 / 1024).toFixed(2)} MB`}
            trend={0}
          />
        </div>

        {/* System Status */}
        <div className="card p-6">
          <h2 className="text-lg font-medium mb-4">System Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Agent System</span>
              <span className="text-green-400">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Memory System</span>
              <span className="text-green-400">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Task Planner</span>
              <span className="text-green-400">Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend 
}: { 
  icon: typeof Brain;
  label: string;
  value: string | number;
  trend: number;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className={`flex items-center space-x-1 text-sm ${
          trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-muted-foreground'
        }`}>
          <span>{Math.abs(trend)}%</span>
          <span>{trend > 0 ? '↑' : trend < 0 ? '↓' : '−'}</span>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold">{value}</h3>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}