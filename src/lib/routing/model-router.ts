import { thoughtLogger } from '../logging/thought-logger';
import { Message } from '../types';
import { models, selectModel, getModelCapabilities } from '../config/models';

export interface RouterConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  confidence: number;
  responseStrategy?: 'stream' | 'complete';
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
      models.xai.grokBeta.id,
      models.groq.advanced.id,
      models.perplexity.large.id,
      models.granite.codeBase.id
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
    const selectedModel = selectModel(query, complexity);
    const capabilities = getModelCapabilities(selectedModel);

    thoughtLogger.log('decision', `Selected model: ${selectedModel}`, {
      complexity,
      capabilities
    });

    // Find model configuration
    const modelConfig = Object.values({
      ...models.groq,
      ...models.perplexity,
      ...models.xai,
      ...models.granite
    }).find(m => m.id === selectedModel);

    if (!modelConfig) {
      throw new Error(`Model configuration not found for ${selectedModel}`);
    }

    return {
      model: modelConfig.id,
      maxTokens: modelConfig.maxTokens,
      temperature: modelConfig.temperature,
      confidence: this.calculateConfidence(complexity, capabilities),
      responseStrategy: this.determineResponseStrategy(query, complexity)
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

  private calculateConfidence(complexity: number, capabilities: string[]): number {
    // Base confidence on complexity and capability match
    const baseConfidence = 0.7;
    const complexityFactor = 1 - (complexity * 0.3); // Lower confidence for higher complexity
    const capabilityBonus = capabilities.length * 0.05; // Bonus for each relevant capability

    return Math.min(baseConfidence + capabilityBonus * complexityFactor, 1);
  }

  private determineResponseStrategy(query: string, complexity: number): 'stream' | 'complete' {
    // Use streaming for complex or long-form responses
    if (complexity > 0.7 || query.length > 200) {
      return 'stream';
    }
    return 'complete';
  }
}