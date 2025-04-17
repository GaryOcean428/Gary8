import { thoughtLogger } from '../logging/thought-logger';
import { Message } from '../types';

export interface RouterConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  confidence: number;
  responseStrategy: string;
  routingExplanation: string;
  questionType: string;
  consideredModels: string[];
}

export class ModelRouter {
  private readonly threshold = 0.63;
  private readonly models = {
    local: 'ibm-granite/granite-3b-code-base-2k',
    low: 'llama-3.2-3b-preview',
    mid: 'llama-3.2-7b-preview',
    high: 'llama-3.2-70b-preview',
    superior: 'grok-beta',
    search: 'sonar-reasoning-pro'  // Updated to use Perplexity's reasoning model
  };

  async route(query: string, history: Message[]): Promise<RouterConfig> {
    thoughtLogger.log('reasoning', 'Analyzing query for model selection');

    const complexity = this.assessComplexity(query);
    const contextLength = this.calculateContextLength(history);
    const requiresSearch = this.requiresSearch(query);
    const requiresCode = this.requiresCodeExecution(query);
    const questionType = this.classifyQuestion(query);

    thoughtLogger.log('observation', 'Query analysis complete', {
      complexity,
      contextLength,
      requiresSearch,
      requiresCode,
      questionType
    });

    const consideredModels: string[] = [];

    if (requiresCode) {
      consideredModels.push(this.models.local);
      return {
        model: this.models.local,
        maxTokens: 2048,
        temperature: 0.7,
        confidence: 0.85,
        responseStrategy: 'code_generation',
        routingExplanation: 'Using Granite model for code-related task',
        questionType,
        consideredModels
      };
    }

    if (requiresSearch) {
      consideredModels.push(this.models.search);
      return {
        model: this.models.search,
        maxTokens: 4096,
        temperature: 0.7,
        confidence: 0.9,
        responseStrategy: 'search',
        routingExplanation: 'Search query detected, using Perplexity Sonar Reasoning Pro model for up-to-date information',
        questionType,
        consideredModels
      };
    }

    if (complexity < 0.3 && contextLength < 1000) {
      consideredModels.push(this.models.low);
      return {
        model: this.models.low,
        maxTokens: 2048,
        temperature: 0.7,
        confidence: 0.8,
        responseStrategy: 'default',
        routingExplanation: 'Simple query detected, using lightweight model',
        questionType,
        consideredModels
      };
    }

    if (complexity < 0.6 && contextLength < 4000) {
      consideredModels.push(this.models.mid);
      return {
        model: this.models.mid,
        maxTokens: 4096,
        temperature: 0.7,
        confidence: 0.85,
        responseStrategy: 'default',
        routingExplanation: 'Moderate complexity detected, using balanced model',
        questionType,
        consideredModels
      };
    }

    if (complexity < 0.8 || contextLength < 8000) {
      consideredModels.push(this.models.high);
      return {
        model: this.models.high,
        maxTokens: 8192,
        temperature: 0.7,
        confidence: 0.9,
        responseStrategy: 'default',
        routingExplanation: 'High complexity detected, using advanced model',
        questionType,
        consideredModels
      };
    }

    consideredModels.push(this.models.superior);
    return {
      model: this.models.superior,
      maxTokens: 8192,
      temperature: 0.7,
      confidence: 0.95,
      responseStrategy: 'default',
      routingExplanation: 'Complex query detected, using superior model',
      questionType,
      consideredModels
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
    const codeKeywords = [
      'code',
      'function',
      'program',
      'algorithm',
      'implement',
      'debug',
      'compile',
      'execute'
    ];

    return codeKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
  }

  private requiresSearch(query: string): boolean {
    const searchTerms = [
      'search',
      'find',
      'look up',
      'latest',
      'current',
      'news',
      'information about',
      'tell me about'
    ];

    return searchTerms.some(term => 
      query.toLowerCase().includes(term)
    );
  }

  private classifyQuestion(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (/\b(how|why|explain)\b/.test(lowerQuery)) {
      return 'problem_solving';
    }
    if (/\b(what|who|where|when)\b/.test(lowerQuery)) {
      return 'factual';
    }
    if (/^(is|are|can|do|does)\b/.test(lowerQuery)) {
      return 'yes_no';
    }
    if (/\b(compare|contrast|analyze)\b/.test(lowerQuery)) {
      return 'analysis';
    }
    if (/\b(hi|hello|hey|how are you)\b/.test(lowerQuery)) {
      return 'casual';
    }
    return 'open_ended';
  }
}