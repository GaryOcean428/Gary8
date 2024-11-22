import { thoughtLogger } from '../logging/thought-logger';
import { LangChainConfig } from '../config/langchain-config';
import { traceable } from 'langsmith';
import type { Run } from 'langsmith/schemas';
import { ToolhouseConfig } from '../config/toolhouse-config';
import { ChatMessage } from '@langchain/core/messages';
import { StructuredTool } from '@langchain/core/tools';

export class LangChainService {
    private static instance: LangChainService;
    private config: LangChainConfig;
    private toolhouse: ToolhouseConfig;
    private tools: Map<string, StructuredTool> = new Map();

    private constructor() {
        this.config = LangChainConfig.getInstance();
        this.toolhouse = ToolhouseConfig.getInstance();
    }

    static getInstance(): LangChainService {
        if (!LangChainService.instance) {
            LangChainService.instance = new LangChainService();
        }
        return LangChainService.instance;
    }

    @traceable({ tags: ["code-analysis"] })
    async analyzeCode(code: string): Promise<any> {
        try {
            thoughtLogger.log('info', 'Starting code analysis with LangChain');
            const client = this.config.getClient();
            const tools = await this.toolhouse.getToolsForProvider('anthropic');

            // Create a new run
            const run = await client.createRun({
                name: "code-analysis",
                inputs: { code },
                tags: ["code-analysis"],
            });

            // Perform analysis with tools
            const result = await this.performAnalysis(code, run, tools);

            // Update run with results
            await client.updateRun(run.id, {
                outputs: result,
                endTime: new Date(),
                status: "completed"
            });

            return result;
        } catch (error) {
            thoughtLogger.log('error', 'Code analysis failed', { error });
            throw error;
        }
    }

    @traceable({ tags: ["quality-check"] })
    async checkCodeQuality(code: string): Promise<any> {
        try {
            thoughtLogger.log('info', 'Starting code quality check with LangChain');
            const client = this.config.getClient();
            const tools = await this.toolhouse.getToolsForProvider('groq');

            const run = await client.createRun({
                name: "quality-check",
                inputs: { code },
                tags: ["quality-check"],
            });

            const result = await this.performQualityCheck(code, run, tools);

            await client.updateRun(run.id, {
                outputs: result,
                endTime: new Date(),
                status: "completed"
            });

            return result;
        } catch (error) {
            thoughtLogger.log('error', 'Quality check failed', { error });
            throw error;
        }
    }

    @traceable({ tags: ["code-generation"] })
    async generateCode(prompt: string, context?: any): Promise<string> {
        try {
            thoughtLogger.log('info', 'Starting code generation');
            const client = this.config.getClient();
            const tools = await this.toolhouse.getToolsForProvider('anthropic');

            const run = await client.createRun({
                name: "code-generation",
                inputs: { prompt, context },
                tags: ["code-generation"],
            });

            const model = this.config.getModel('anthropic');
            const messages = [
                new ChatMessage('system', 'You are an expert code generator.'),
                new ChatMessage('user', prompt)
            ];

            const response = await model.invoke(messages, { tools });
            const generatedCode = response.content;

            await client.updateRun(run.id, {
                outputs: { generatedCode },
                endTime: new Date(),
                status: "completed"
            });

            return generatedCode;
        } catch (error) {
            thoughtLogger.log('error', 'Code generation failed', { error });
            throw error;
        }
    }

    private async performAnalysis(code: string, run: Run, tools: any[]): Promise<any> {
        const model = this.config.getModel('groq');
        const messages = [
            new ChatMessage('system', 'Analyze the following code for complexity, patterns, and potential issues.'),
            new ChatMessage('user', code)
        ];

        const response = await model.invoke(messages, { tools });
        const analysis = JSON.parse(response.content);

        return {
            complexity: analysis.complexity,
            patterns: analysis.patterns,
            issues: analysis.issues,
            suggestions: analysis.suggestions
        };
    }

    private async performQualityCheck(code: string, run: Run, tools: any[]): Promise<any> {
        const model = this.config.getModel('perplexity');
        const messages = [
            new ChatMessage('system', 'Perform a comprehensive code quality assessment.'),
            new ChatMessage('user', code)
        ];

        const response = await model.invoke(messages, { tools });
        const assessment = JSON.parse(response.content);

        return {
            score: assessment.score,
            issues: assessment.issues,
            recommendations: assessment.recommendations,
            metrics: {
                complexity: assessment.metrics.complexity,
                maintainability: assessment.metrics.maintainability,
                reliability: assessment.metrics.reliability
            }
        };
    }

    async registerCustomTool(name: string, tool: StructuredTool): Promise<void> {
        this.tools.set(name, tool);
        thoughtLogger.log('success', `Custom tool ${name} registered`);
    }

    async getRegisteredTools(): Promise<StructuredTool[]> {
        return Array.from(this.tools.values());
    }
} 