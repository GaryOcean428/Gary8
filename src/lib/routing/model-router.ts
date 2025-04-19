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
    // Claude 3.7 for code and high-complexity tasks
    local: 'claude-3-7-sonnet-20250219',
    // Versatile open-source LLaMA
    low: 'llama-3.3-70b-versatile',
    // Claude Haiku for moderate tasks
    mid: 'claude-3.5-haiku-latest',
    // Claude Sonnet for high-complexity
    high: 'claude-3-7-sonnet-20250219',
    // GPT-4.5 for creative generation
    superior: 'gpt-4.5-preview',
    // Perplexity Sonar Reasoning Pro for up-to-date search
    search: 'sonar-reasoning-pro'
  };

  async route(_query: string, _history: Message[]): Promise<RouterConfig> {
    thoughtLogger.log('reasoning', 'Analyzing query for model selection');

    const q = _query.toLowerCase();
    const complexity = this.assessComplexity(q);
    const contextLength = this.calculateContextLength(_history);
    const requiresSearch = this.requiresSearch(q);
    const requiresCode = this.requiresCodeExecution(q);
    const questionType = this.classifyQuestion(q);

    thoughtLogger.log('observation', 'Query analysis complete', {
      complexity,
      contextLength,
      requiresSearch,
      requiresCode,
      questionType
    });

    const consideredModels: string[] = [];
    // Branch: code-related tasks
    if (requiresCode) {
      consideredModels.push(this.models.local);
      return {
        model: this.models.local,
        maxTokens: 8192,
        temperature: 0.7,
        confidence: 0.9,
        responseStrategy: 'code_generation',
        routingExplanation: 'Code-related task detected; using Claude 3.7 for code generation',
        questionType,
        consideredModels
      };
    }
    // Branch: creative generation
    // Creative generation tasks (e.g., stories, ideas, innovations)
    if (/\b(story|stories|generate|ideas?|innovative|creative|create|joke|jokes)\b/.test(q)) {
      consideredModels.push(this.models.superior);
      return {
        model: this.models.superior,
        maxTokens: 4096,
        temperature: 0.8,
        confidence: 0.8,
        responseStrategy: 'creative_generation',
        routingExplanation: 'Creative task detected; using GPT-4.5 for creative generation',
        questionType,
        consideredModels
      };
    }
    // Branch: search queries
    if (requiresSearch) {
      consideredModels.push(this.models.search);
      return {
        model: this.models.search,
        maxTokens: 4096,
        temperature: 0.7,
        confidence: 0.9,
        responseStrategy: 'search_and_synthesize',
        routingExplanation: 'Search query detected; using Perplexity Sonar Reasoning Pro',
        questionType,
        consideredModels
      };
    }
    // Branch: multi-step reasoning
    if (/\b(then|after|before|finally)\b/.test(q)) {
      consideredModels.push(this.models.high);
      return {
        model: this.models.high,
        maxTokens: 8192,
        temperature: 0.7,
        confidence: 0.9,
        responseStrategy: 'chain_of_thought',
        routingExplanation: 'Multi-step reasoning detected; using chain-of-thought on Claude 3.7',
        questionType,
        consideredModels
      };
    }
    // Branch: comparative analysis questions
    if (questionType === 'analysis') {
      consideredModels.push(this.models.high);
      return {
        model: this.models.high,
        maxTokens: 8192,
        temperature: 0.7,
        confidence: 0.9,
        responseStrategy: 'comparative_analysis',
        routingExplanation: 'Comparative analysis detected; using Claude 3.7',
        questionType,
        consideredModels
      };
    }
    // Branch: problem-solving queries (moderate complexity)
    if (questionType === 'problem_solving') {
      consideredModels.push(this.models.mid);
      return {
        model: this.models.mid,
        maxTokens: 4096,
        temperature: 0.7,
        confidence: 0.85,
        responseStrategy: 'chain_of_thought',
        routingExplanation: 'Problem-solving query detected; using chain-of-thought on Claude Haiku',
        questionType,
        consideredModels
      };
    }
    // Branch: factual questions (direct answers)
    if (questionType === 'factual') {
      consideredModels.push(this.models.low);
      return {
        model: this.models.low,
        maxTokens: 2048,
        temperature: 0.7,
        confidence: 0.8,
        responseStrategy: 'direct_answer',
        routingExplanation: 'Factual question detected; using LLaMA versatile model for direct answer',
        questionType,
        consideredModels
      };
    }
    // Branch: extended context - prefer high-capacity model if conversation is long
    if (_history.length > 10) {
      consideredModels.push(this.models.high);
      return {
        model: this.models.high,
        maxTokens: 8192,
        temperature: 0.7,
        confidence: 0.9,
        responseStrategy: 'default',
        routingExplanation: 'Extended context detected; using advanced model',
        questionType,
        consideredModels
      };
    }
    // Branch: simple queries (low complexity)
    if (complexity < 0.3 && contextLength < 1000) {
      consideredModels.push(this.models.low);
      return {
        model: this.models.low,
        maxTokens: 2048,
        temperature: 0.7,
        confidence: 0.8,
        responseStrategy: 'default',
        routingExplanation: 'Simple query detected; using versatile LLaMA model',
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
        routingExplanation: 'Moderate complexity detected; using Claude Haiku for balanced tasks',
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
        routingExplanation: 'High complexity detected; using Claude Sonnet for advanced reasoning',
        questionType,
        consideredModels
      };
    }

    // Fallback to creative flagship for very complex or uncategorized tasks
    consideredModels.push(this.models.superior);
    return {
      model: this.models.superior,
      maxTokens: 8192,
      temperature: 0.7,
      confidence: 0.95,
      responseStrategy: 'default',
      routingExplanation: 'Complex or uncategorized query; using GPT-4.5 flagship',
      questionType,
      consideredModels
    };
  }

  private assessComplexity(_query: string): number {
    const factors = {
      length: Math.min(_query.length / 500, 1),
      questionWords: (_query.match(/\b(how|why|what|when|where|who|explain)\b/gi) || []).length * 0.1,
      technicalTerms: (_query.match(/\b(algorithm|function|process|system|analyze|architecture|performance|reliability|security)\b/gi) || []).length * 0.15,
      codeRelated: /\b(code|program|debug|function|api|schema|implement|optimize)\b/i.test(_query) ? 0.3 : 0,
      multipleSteps: 0 // multi-step handled separately
    };

    return Math.min(
      Object.values(factors).reduce((_sum, _value) => _sum + _value, 0),
      1
    );
  }

  private calculateContextLength(_history: Message[]): number {
    return _history.reduce((_sum, _msg) => _sum + _msg.content.length, 0);
  }

  private requiresCodeExecution(_query: string): boolean {
    const codeKeywords = [
      'code',
      'function',
      'program',
      'algorithm',
      'implement',
      'optimize',
      'debug',
      'compile',
      'execute',
      'schema'
    ];
    const text = _query.toLowerCase();
    return codeKeywords.some(_keyword => {
      const pattern = new RegExp(`\\b${_keyword}\\b`);
      return pattern.test(text);
    });
  }

  private requiresSearch(_query: string): boolean {
    const searchTerms = [
      'research',
      'search',
      'weather',
      'find',
      'look up',
      'latest',
      'current',
      'news',
      'information about',
      'tell me about'
    ];

    return searchTerms.some(_term => 
      _query.toLowerCase().includes(_term)
    );
  }

  private classifyQuestion(_query: string): string {
    const lowerQuery = _query.toLowerCase();
    
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