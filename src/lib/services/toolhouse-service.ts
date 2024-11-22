import { Toolhouse } from "@toolhouseai/sdk";
import { thoughtLogger } from "../logging/thought-logger";
import { Messages } from "@anthropic-ai/sdk";
import { ErrorHandler } from "../utils/error-handler";
import { LocalToolsRegistry } from "../tools/local-tools-registry";
import { registerCodeSearchTool } from "../tools/local/code-search-tool";

export class ToolhouseService {
    private static instance: ToolhouseService;
    private toolhouse: Toolhouse;
    private localToolsRegistry: LocalToolsRegistry;
    private initialized = false;

    private constructor() {
        this.toolhouse = new Toolhouse({
            apiKey: process.env.TOOLHOUSE_API_KEY!,
            provider: "anthropic",
            metadata: {
                "id": process.env.TOOLHOUSE_APP_ID || "gary8-assistant",
                "timezone": Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        });
        this.localToolsRegistry = LocalToolsRegistry.getInstance(this.toolhouse);
    }

    static getInstance(): ToolhouseService {
        if (!ToolhouseService.instance) {
            ToolhouseService.instance = new ToolhouseService();
        }
        return ToolhouseService.instance;
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            thoughtLogger.log('info', 'Initializing Toolhouse service');
            
            // Register local tools
            await this.registerLocalTools();
            
            // Get all tools (including local ones)
            const tools = await this.toolhouse.getTools();
            
            this.initialized = true;
            thoughtLogger.log('success', 'Toolhouse service initialized', { 
                toolCount: tools.length 
            });
        } catch (error) {
            throw ErrorHandler.handleWithThrow(error, 'initialize toolhouse service');
        }
    }

    private async registerLocalTools() {
        // Register code search tool
        registerCodeSearchTool(this.localToolsRegistry);
        
        // Register other local tools here
        thoughtLogger.log('success', 'Local tools registered');
    }

    async processWithTools(messages: Messages.MessageParam[]): Promise<Messages.MessageParam[]> {
        try {
            thoughtLogger.log('info', 'Processing messages with Toolhouse tools');

            // Get all tools including local ones
            const tools = await this.toolhouse.getTools();
            const localTools = this.localToolsRegistry.getLocalTools();
            const allTools = [...tools, ...localTools];

            // First call to get tool results
            const response = await this.callModel(messages, allTools);
            
            // Run tools and append results to messages
            const toolResults = await this.toolhouse.runTools(response) as Messages.MessageParam[];
            const updatedMessages = [...messages, ...toolResults];
            
            // Final call with tool results
            const finalResponse = await this.callModel(updatedMessages, allTools);
            
            thoughtLogger.log('success', 'Toolhouse processing complete');
            return [finalResponse];
        } catch (error) {
            thoughtLogger.log('error', 'Toolhouse processing failed', { error });
            throw error;
        }
    }

    private async callModel(messages: Messages.MessageParam[], tools: any) {
        const anthropicClient = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY!,
        });

        return await anthropicClient.messages.create({
            model: "claude-3-sonnet-20240229",
            max_tokens: 1024,
            messages,
            tools
        });
    }

    async switchProvider(provider: 'anthropic' | 'vercel' | 'llamaindex'): Promise<void> {
        try {
            this.toolhouse = new Toolhouse({
                apiKey: process.env.TOOLHOUSE_API_KEY!,
                provider,
                metadata: {
                    "id": process.env.TOOLHOUSE_APP_ID || "gary8-assistant",
                    "timezone": Intl.DateTimeFormat().resolvedOptions().timeZone
                }
            });
            await this.toolhouse.getTools();
            thoughtLogger.log('success', `Switched to ${provider} provider`);
        } catch (error) {
            throw ErrorHandler.handleWithThrow(error, 'switch toolhouse provider');
        }
    }

    async getToolsForBundle(bundle: string): Promise<any> {
        try {
            thoughtLogger.log('info', `Getting tools for bundle: ${bundle}`);
            
            const tools = await this.toolhouse.getTools({ bundle });
            
            thoughtLogger.log('success', `Retrieved tools for bundle: ${bundle}`, {
                toolCount: tools.length
            });
            
            return tools;
        } catch (error) {
            throw ErrorHandler.handleWithThrow(error, 'get tools for bundle');
        }
    }
} 