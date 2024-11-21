import { thoughtLogger } from '../logging/thought-logger';
import { Message } from '../types';
import { config } from '../config';

export interface RouterConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  confidence: number;
}

export class ModelRouter {
  private static instance: ModelRouter;
  private initialized = false;

  private constructor() {}

  static getInstance(): ModelRouter {
    if (!ModelRouter.instance) {
      ModelRouter.instance = new ModelRouter();
    }
    return ModelRouter.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Validate model configurations
      this.validateModelConfigs();
      this.initialized = true;
      thoughtLogger.log('success', 'Model router initialized');
    } catch (error) {
      thoughtLogger.log('error', 'Failed to initialize model router', { error });
      throw error;
    }
  }

  private validateModelConfigs(): void {
    const requiredModels = [
      config.services.xai.defaultModel,
      config.services.groq.models.large,
      config.services.perplexity.defaultModel
    ];

    const missingModels = requiredModels.filter(model => !model);
    if (missingModels.length > 0) {
      throw new Error(`Missing required model configurations: ${missingModels.join(', ')}`);
    }
  }

  async route(query: string, history: Message[]): Promise<RouterConfig> {
    if (!this.initialized) {
      await this.initialize();
    }

    thoughtLogger.log('reasoning', 'Analyzing query for model selection');

    const complexity = this.assessComplexity(query);
    const contextLength = this.calculateContextLength(history);
    const requiresCode = this.requiresCodeExecution(query);
    const requiresSearch = this.requiresSearch(query);

    thoughtLogger.log('observation', 'Query analysis complete', {
      complexity,
      contextLength,
      requiresCode,
      requiresSearch
    });

    // Route based on requirements
    if (requiresCode) {
      return {
        model: config.services.groq.models.medium,
        maxTokens: 4096,
        temperature: 0.7,
        confidence: 0.9
      };
    }

    if (requiresSearch) {
      return {
        model: config.services.perplexity.defaultModel,
        maxTokens: config.services.perplexity.maxTokens,
        temperature: config.services.perplexity.temperature,
        confidence: 0.9
      };
    }

    if (complexity > 0.8 || contextLength > 8000) {
      return {
        model: config.services.xai.defaultModel,
        maxTokens: config.services.xai.maxTokens,
        temperature: config.services.xai.temperature,
        confidence: 0.95
      };
    }

    return {
      model: config.services.groq.models.large,
      maxTokens: config.services.groq.maxTokens,
      temperature: config.services.groq.temperature,
      confidence: 0.85
    };
  }

  private assessComplexity(query: string): number {
    const factors = {
      length: Math.min(query.length / 500, 1),
      questionWords: (query.match(/\b(how|why|what|when|where|who)\b/gi) || []).length * 0.1,
      technicalTerms: (query.match(/\b(algorithm|function|process|system|analyze)\b/gi) || []).length * 0.15,
      codeRelated: /\b(code|program|debug|function|api)\b/i.test(query) ? 0.3 : 0,
      multipleSteps: (query.match(/\b(and|then|after|before|finally)\b/gi) || []).length * 0.1
    };

    return Math.min(
      Object.values(factors).reduce((sum, value) => sum + value, 0),
      1
    );
  }

  private calculateContextLength(history: Message[]): number {
    return history.reduce((sum, msg) => sum + msg.content.length, 0);
  }

  private requiresCodeExecution(query: string): boolean {
    return /\b(code|function|program|algorithm|implement|debug|compile|execute)\b/i.test(query);
  }

  private requiresSearch(query: string): boolean {
    return /\b(search|find|look up|latest|current|news|information about|tell me about)\b/i.test(query);
  }

  get isInitialized(): boolean {
    return this.initialized;
  }
}