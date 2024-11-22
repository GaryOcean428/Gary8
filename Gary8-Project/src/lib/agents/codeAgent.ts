import { Agent, AgentInput, AgentOutput } from './index';
import { CodeAwareness } from '../services/codeAwareness';

export class CodeAgent implements Agent {
    id = 'code-agent';
    name = 'Code Agent';
    description = 'Handles code analysis, generation, and review';
    capabilities = ['code-analysis', 'code-generation', 'code-review'];
    model = 'llama-3.2-70b-preview';

    private codeAwareness: CodeAwareness;

    constructor() {
        this.codeAwareness = CodeAwareness.getInstance();
    }

    async execute(input: AgentInput): Promise<AgentOutput> {
        const codeContext = await this.codeAwareness.analyzeCode(input.prompt);
        
        return {
            response: await this.generateCodeResponse(input.prompt, codeContext),
            thoughts: ['Analyzed code context', 'Generated response'],
            metadata: { context: codeContext }
        };
    }

    private async generateCodeResponse(prompt: string, context: any): Promise<string> {
        // Generate code-aware response
        return `Code response based on context: ${context}`;
    }
} 