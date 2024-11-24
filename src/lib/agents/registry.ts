import { z } from 'zod';
import { 
  AgentConfig, 
  AgentConfigSchema, 
  AgentState, 
  AgentStateSchema,
  AgentRole,
  AGENT_ROLES
} from './agent-types';
import { thoughtLogger } from '../utils/logger';
import { MonitoringService } from '../monitoring/monitoring-service';

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, AgentState>;
  private configs: Map<string, AgentConfig>;
  private monitoring: MonitoringService;

  private constructor() {
    this.agents = new Map();
    this.configs = new Map();
    this.monitoring = MonitoringService.getInstance();
  }

  static getInstance(): AgentRegistry {
    if (!this.instance) {
      this.instance = new AgentRegistry();
    }
    return this.instance;
  }

  async registerAgent(config: AgentConfig): Promise<void> {
    try {
      // Validate config using Zod
      AgentConfigSchema.parse(config);

      const initialState: AgentState = {
        id: config.id,
        status: 'idle',
        subordinates: [],
        lastActive: Date.now(),
        metrics: {
          tasksCompleted: 0,
          successRate: 0,
          averageResponseTime: 0
        }
      };

      // Validate initial state
      AgentStateSchema.parse(initialState);

      this.configs.set(config.id, config);
      this.agents.set(config.id, initialState);

      thoughtLogger.info('Agent registered', { 
        agentId: config.id, 
        role: config.role 
      });
    } catch (error) {
      thoughtLogger.error('Failed to register agent', { error, config });
      throw error;
    }
  }

  getAgentsByRole(role: AgentRole): AgentConfig[] {
    return Array.from(this.configs.values())
      .filter(config => config.role === role);
  }

  getAgentState(id: string): AgentState | undefined {
    return this.agents.get(id);
  }

  updateAgentState(id: string, update: Partial<AgentState>): void {
    const currentState = this.agents.get(id);
    if (!currentState) {
      throw new Error(`Agent ${id} not found`);
    }

    const newState = {
      ...currentState,
      ...update,
      lastActive: Date.now()
    };

    // Validate updated state
    AgentStateSchema.parse(newState);
    this.agents.set(id, newState);

    // Track state change
    this.monitoring.trackOperation('agent_state_update', async () => {
      thoughtLogger.info('Agent state updated', { 
        agentId: id, 
        update 
      });
    });
  }

  getAgentHierarchy(rootId: string): AgentConfig[] {
    const hierarchy: AgentConfig[] = [];
    const visited = new Set<string>();

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const config = this.configs.get(id);
      if (!config) return;

      hierarchy.push(config);
      const state = this.agents.get(id);
      state?.subordinates.forEach(subId => traverse(subId));
    };

    traverse(rootId);
    return hierarchy;
  }

  getAvailableAgents(): AgentConfig[] {
    return Array.from(this.agents.entries())
      .filter(([_, state]) => state.status === 'idle')
      .map(([id]) => this.configs.get(id)!)
      .filter(Boolean);
  }
}
