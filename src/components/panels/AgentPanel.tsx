'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AgentOrchestrator } from '@/lib/agents/orchestrator';
import { AgentState, AgentConfig } from '@/lib/agents/agent-types';
import { thoughtLogger } from '@/lib/utils/logger';
import { Settings, Play, Pause, Monitor, Brain, Code, Globe } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface AgentCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  state: AgentState;
  onSettings: () => void;
}

const AgentCard = ({ name, description, icon, state, onSettings }: AgentCardProps) => (
  <Card className="p-4">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onSettings}>
        <Settings className="w-4 h-4" />
      </Button>
    </div>
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm">Status: {state.status}</span>
        <div className={`w-2 h-2 rounded-full ${
          state.status === 'idle' ? 'bg-blue-500' :
          state.status === 'busy' ? 'bg-yellow-500' :
          'bg-green-500'
        }`} />
      </div>
      <div className="text-sm">
        Tasks: {state.successCount} completed / {state.errorCount} failed
      </div>
    </div>
  </Card>
);

export function AgentPanel() {
  const [agents, setAgents] = useState<Map<string, AgentState>>(new Map());
  const [activeLog, setActiveLog] = useState<string[]>([]);
  const orchestrator = AgentOrchestrator.getInstance();
  const { theme } = useTheme();

  useEffect(() => {
    const updateInterval = setInterval(fetchAgentStates, 1000);
    return () => clearInterval(updateInterval);
  }, []);

  async function fetchAgentStates() {
    try {
      const states = await orchestrator.getAgentStates();
      setAgents(new Map(states));
    } catch (error) {
      thoughtLogger.error('Failed to fetch agent states', { error });
    }
  }

  async function handleStartAll() {
    try {
      await orchestrator.startAllAgents();
      thoughtLogger.info('All agents started');
    } catch (error) {
      thoughtLogger.error('Failed to start agents', { error });
    }
  }

  async function handlePauseAll() {
    try {
      await orchestrator.pauseAllAgents();
      thoughtLogger.info('All agents paused');
    } catch (error) {
      thoughtLogger.error('Failed to pause agents', { error });
    }
  }

  return (
    <div className="h-full flex flex-col p-4 space-y-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          Agent Control
        </h2>
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleStartAll}
            className="flex items-center gap-1"
          >
            <Play className="w-4 h-4" />
            Start All
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePauseAll}
            className="flex items-center gap-1"
          >
            <Pause className="w-4 h-4" />
            Pause All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AgentCard
          name="Orchestrator"
          description="Task Planning & Coordination"
          icon={<Brain className="w-5 h-5 text-primary" />}
          state={agents.get('orchestrator') || { status: 'idle', successCount: 0, errorCount: 0 }}
          onSettings={() => {}}
        />
        <AgentCard
          name="WebSurfer"
          description="Web Interaction & Research"
          icon={<Globe className="w-5 h-5 text-primary" />}
          state={agents.get('websurfer') || { status: 'idle', successCount: 0, errorCount: 0 }}
          onSettings={() => {}}
        />
        <AgentCard
          name="Coder"
          description="Code Analysis & Generation"
          icon={<Code className="w-5 h-5 text-primary" />}
          state={agents.get('coder') || { status: 'idle', successCount: 0, errorCount: 0 }}
          onSettings={() => {}}
        />
      </div>

      <Card className="flex-1 min-h-[200px] p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary" />
            Live Activity
          </h3>
          <Button variant="ghost" size="sm">
            Clear
          </Button>
        </div>
        <div className="h-[calc(100%-2rem)] overflow-auto rounded-lg bg-muted p-4">
          <pre className="text-sm font-mono text-muted-foreground whitespace-pre-wrap">
            {activeLog.join('\n')}
          </pre>
        </div>
      </Card>
    </div>
  );
}