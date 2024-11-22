import { Toolhouse } from "@toolhouseai/sdk";
import { thoughtLogger } from "../logging/thought-logger";
import { ErrorHandler } from "../utils/error-handler";

export class ToolhouseConfig {
    private static instance: ToolhouseConfig;
    private toolhouse: Toolhouse;
    private initialized = false;

    private constructor() {
        this.toolhouse = new Toolhouse({
            apiKey: process.env.TOOLHOUSE_API_KEY!,
            provider: "anthropic", // Default provider
            metadata: {
                "id": process.env.TOOLHOUSE_APP_ID || "gary8-assistant"
            }
        });
    }

    static getInstance(): ToolhouseConfig {
        if (!ToolhouseConfig.instance) {
            ToolhouseConfig.instance = new ToolhouseConfig();
        }
        return ToolhouseConfig.instance;
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            thoughtLogger.log('info', 'Initializing Toolhouse configuration');
            
            // Verify API key
            if (!process.env.TOOLHOUSE_API_KEY) {
                throw new Error('Toolhouse API key not found');
            }

            // Initialize default tools bundle
            await this.toolhouse.getTools();
            
            this.initialized = true;
            thoughtLogger.log('success', 'Toolhouse configuration initialized');
        } catch (error) {
            throw ErrorHandler.handleWithThrow(error, 'initialize toolhouse config');
        }
    }

    getToolhouse(): Toolhouse {
        if (!this.initialized) {
            throw new Error('Toolhouse not initialized');
        }
        return this.toolhouse;
    }

    async getToolsForProvider(provider: 'anthropic' | 'vercel' | 'llamaindex' = 'anthropic'): Promise<any> {
        try {
            this.toolhouse = new Toolhouse({
                apiKey: process.env.TOOLHOUSE_API_KEY!,
                provider,
                metadata: {
                    "id": process.env.TOOLHOUSE_APP_ID || "gary8-assistant"
                }
            });
            return await this.toolhouse.getTools();
        } catch (error) {
            throw ErrorHandler.handleWithThrow(error, 'get tools for provider');
        }
    }
} 