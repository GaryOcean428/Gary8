import { thoughtLogger } from '../logging/thought-logger';
import { Client } from 'langsmith';
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGroq } from "@langchain/groq";
import { ChatPerplexity } from "@langchain/perplexity";

export class LangChainConfig {
    private static instance: LangChainConfig;
    private client: Client;
    private initialized = false;

    private constructor() {
        this.client = new Client({
            apiKey: process.env.LANGCHAIN_API_KEY,
            endpoint: process.env.LANGCHAIN_ENDPOINT
        });
    }

    static getInstance(): LangChainConfig {
        if (!LangChainConfig.instance) {
            LangChainConfig.instance = new LangChainConfig();
        }
        return LangChainConfig.instance;
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            thoughtLogger.log('info', 'Initializing LangChain configuration');

            // Configure tracing
            process.env.LANGCHAIN_TRACING_V2 = 'true';
            process.env.LANGCHAIN_CALLBACKS_BACKGROUND = 'false';

            // Initialize models
            await this.initializeModels();

            this.initialized = true;
            thoughtLogger.log('success', 'LangChain configuration initialized');
        } catch (error) {
            thoughtLogger.log('error', 'Failed to initialize LangChain config', { error });
            throw error;
        }
    }

    private async initializeModels() {
        const models = {
            anthropic: new ChatAnthropic({
                anthropicApiKey: process.env.ANTHROPIC_API_KEY,
                modelName: "claude-3-sonnet-20240229"
            }),
            groq: new ChatGroq({
                apiKey: process.env.GROQ_API_KEY,
                modelName: "mixtral-8x7b-32768"
            }),
            perplexity: new ChatPerplexity({
                apiKey: process.env.PERPLEXITY_API_KEY,
                modelName: "pplx-70b-online"
            })
        };

        return models;
    }

    getClient(): Client {
        if (!this.initialized) {
            throw new Error('LangChain not initialized');
        }
        return this.client;
    }
} 