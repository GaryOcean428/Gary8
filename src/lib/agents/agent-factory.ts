import { TaskAgent } from './core/task-agent';
import { AgentConfig } from './agent-types';

export class AgentFactory {
  static createTaskAgent(config: AgentConfig): TaskAgent {
    return new TaskAgent(config);
  }
} 