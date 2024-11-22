// Core agent types and interfaces
export interface Agent {
    id: string;
    name: string;
    description: string;
    capabilities: string[];
    model: string;
    execute: (input: AgentInput) => Promise<AgentOutput>;
}

export interface AgentInput {
    prompt: string;
    context?: string;
    systemPrompt?: string;
    metadata?: Record<string, any>;
}

export interface AgentOutput {
    response: string;
    thoughts?: string[];
    metadata?: Record<string, any>;
}

// Agent Registry and Management
export class AgentRegistry {
    private static instance: AgentRegistry;
    private agents: Map<string, Agent>;

    private constructor() {
        this.agents = new Map();
    }

    static getInstance(): AgentRegistry {
        if (!AgentRegistry.instance) {
            AgentRegistry.instance = new AgentRegistry();
        }
        return AgentRegistry.instance;
    }

    registerAgent(agent: Agent): void {
        this.agents.set(agent.id, agent);
    }

    getAgent(id: string): Agent | undefined {
        return this.agents.get(id);
    }

    getAllAgents(): Agent[] {
        return Array.from(this.agents.values());
    }
}

// Export specialized agents
export * from './searchAgent';
export * from './codeAgent';
export * from './memoryAgent';
export * from './routerAgent';
export * from './synthesisAgent';

// Export agent factory
export * from './agentFactory';
