import { BaseAgent } from './core/base-agent';
import { AgentConfig } from './agent-types';

interface ReflectionData {
  timestamp: number;
  agentId: string;
  action: string;
  result: unknown;
}

export class ReflectionManager extends BaseAgent {
  private reflectionLog: ReflectionData[] = [];

  constructor(config: AgentConfig) {
    super(config);
  }

  async execute(task: unknown): Promise<unknown> {
    return this.reflect(task);
  }

  private async reflect(data: unknown): Promise<unknown> {
    const reflection: ReflectionData = {
      timestamp: Date.now(),
      agentId: this.getId(),
      action: 'reflect',
      result: data
    };

    this.reflectionLog.push(reflection);
    return reflection;
  }

  getReflectionHistory(): ReflectionData[] {
    return [...this.reflectionLog];
  }
}
