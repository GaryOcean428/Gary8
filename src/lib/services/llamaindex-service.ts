import { thoughtLogger } from '../logging/thought-logger';
import { ToolhouseService } from './toolhouse-service';
import { LangChainConfig } from '../config/langchain-config';
import { ReActAgent } from '@langchain/community/agents';
import { ErrorHandler } from '../utils/error-handler';

export class LlamaIndexService {
    private static instance: LlamaIndexService;
    private toolhouseService: ToolhouseService;
    private langchainConfig: LangChainConfig;
    private agent: ReActAgent | null = null;

    private constructor() {
        this.toolhouseService = ToolhouseService.getInstance();
        this.langchainConfig = LangChainConfig.getInstance();
    }

    static getInstance(): LlamaIndexService {
        if (!LlamaIndexService.instance) {
            LlamaIndexService.instance = new LlamaIndexService();
        }
        return LlamaIndexService.instance;
    }

    async initialize(bundle?: string): Promise<void> {
        try {
            thoughtLogger.log('info', 'Initializing LlamaIndex service');

            // Switch Toolhouse provider to LlamaIndex
            await this.toolhouseService.switchProvider('llamaindex');

            // Get tools (optionally from a specific bundle)
            const tools = bundle 
                ? await this.toolhouseService.getToolsForBundle(bundle)
                : await this.toolhouseService.getToolhouse().getTools();

            // Initialize ReAct agent with Groq model
            const llm = this.langchainConfig.getModel('groq');
            this.agent = await ReActAgent.fromTools(tools, {
                llm,
                verbose: true
            });

            thoughtLogger.log('success', 'LlamaIndex service initialized');
        } catch (error) {
            throw ErrorHandler.handleWithThrow(error, 'initialize llamaindex service');
        }
    }

    async processQuery(query: string): Promise<string> {
        try {
            if (!this.agent) {
                throw new Error('LlamaIndex agent not initialized');
            }

            thoughtLogger.log('info', 'Processing query with LlamaIndex', { query });

            const response = await this.agent.chat(query);
            return response.content;
        } catch (error) {
            thoughtLogger.log('error', 'Query processing failed', { error });
            throw error;
        }
    }

    async searchAndAnalyze(query: string, options: {
        maxResults?: number;
        includeMetadata?: boolean;
        bundle?: string;
    } = {}): Promise<any> {
        try {
            // Initialize with specific bundle if provided
            if (options.bundle && (!this.agent || this.currentBundle !== options.bundle)) {
                await this.initialize(options.bundle);
            }

            thoughtLogger.log('info', 'Searching and analyzing with LlamaIndex', { 
                query, 
                options 
            });

            const response = await this.processQuery(
                `Search and analyze the following: ${query}. ` +
                `Return up to ${options.maxResults || 5} results. ` +
                `${options.includeMetadata ? 'Include metadata.' : ''}`
            );

            return JSON.parse(response);
        } catch (error) {
            thoughtLogger.log('error', 'Search and analysis failed', { error });
            throw error;
        }
    }

    private currentBundle?: string;
} 