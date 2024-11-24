import { BaseAgent } from './base-agent';
import { AgentConfig } from '../types';
import { PrimaryAgent } from '../primary-agent';
import { SpecialistAgent } from '../specialist-agent';
import { TaskAgent } from '../task-agent';

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, BaseAgent> = new Map();

  private constructor() {}

  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  createAgent(config: AgentConfig): BaseAgent {
    if (this.agents.has(config.id)) {
      throw new Error(`Agent with ID ${config.id} already exists`);
    }

    let agent: BaseAgent;
    switch (config.role) {
      case 'primary':
        agent = new PrimaryAgent(config);
        break;
      case 'specialist':
        agent = new SpecialistAgent(config);
        break;
      case 'task':
        agent = new TaskAgent(config);
        break;
      default:
        throw new Error(`Unknown agent role: ${config.role}`);
    }

    this.agents.set(config.id, agent);
    return agent;
  }

  getAgent(id: string): BaseAgent | undefined {
    return this.agents.get(id);
  }

  removeAgent(id: string): boolean {
    return this.agents.delete(id);
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  getAgentsByRole(role: string): BaseAgent[] {
    return Array.from(this.agents.values()).filter(agent => agent.getRole() === role);
  }

  clear(): void {
    this.agents.clear();
  }
}