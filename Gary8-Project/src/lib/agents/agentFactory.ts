import { Agent } from './index';
import { SearchAgent } from './searchAgent';
import { CodeAgent } from './codeAgent';
import { MemoryAgent } from './memoryAgent';
import { RouterAgent } from './routerAgent';
import { SynthesisAgent } from './synthesisAgent';

export class AgentFactory {
    static createAgent(type: string): Agent {
        switch (type) {
            case 'search':
                return new SearchAgent();
            case 'code':
                return new CodeAgent();
            case 'memory':
                return new MemoryAgent();
            case 'router':
                return new RouterAgent();
            case 'synthesis':
                return new SynthesisAgent();
            default:
                throw new Error(`Unknown agent type: ${type}`);
        }
    }
} 