import { z } from 'zod';

// Define capability requirements schema
const CapabilityRequirement = z.enum([
  'REASONING',     // Enhanced reasoning
  'CODE',          // Code generation and understanding
  'KNOWLEDGE',     // Factual retrieval and processing
  'CREATIVITY',    // Creative generation
  'LONG_CONTEXT',  // Long context handling
  'REALTIME',      // Optimized for low latency
  'MATH',          // Mathematical reasoning
  'SEARCH',        // Web search capability
  'COMPUTER_USE',  // Computer use capability
]);

type Capability = z.infer<typeof CapabilityRequirement>;

// Model tiers with modern capabilities
enum ModelTier {
  BASELINE = "baseline",     // For simple, quick responses (e.g., GPT-4o-mini)
  STANDARD = "standard",     // For general tasks (e.g., GPT-4o)
  ADVANCED = "advanced",     // For complex reasoning (e.g., GPT-4.1, Claude 3.5 Sonnet)
  SUPERIOR = "superior",     // For expert-level tasks (e.g., Claude 3.7 Sonnet, o1)
  SPECIALIZED = "specialized" // For domain-specific tasks (e.g., o3-mini for STEM)
}

// Model configuration interface
interface ModelConfig {
  name: string;
  provider: string;
  maxTokens: number;
  temperature: number;
  supportsReasoning: boolean;
  supportsSearch: boolean;
  supportsComputerUse: boolean;
  contextWindow: number;
  streamingOptimized: boolean;
  specializedDomains: string[];
  costTier: number; // 1-5 scale (1=lowest cost, 5=highest)
  apiConfig: {
    endpoint: string;
    apiVersion?: string;
    responseFormat?: string;
    headers?: Record<string, string>;
    params?: Record<string, any>;
  };
}

// Context thresholds for routing decisions
const DEFAULT_CONTEXT_THRESHOLDS = {
  standard: 4000,    // Characters for standard context
  medium: 16000,     // Characters for medium context
  large: 64000,      // Characters for large context
  xl: 200000         // Characters for extra large context
};

/**
 * AI Router Result interface
 */
interface AIRouterResult {
  model: ModelConfig;
  modelTier: ModelTier;
  complexity: number;
  taskType: string;
  questionType: string;
  capabilities: Capability[];
  responseStrategy: string;
  routingExplanation: string;
  configOverrides?: Record<string, any>;
}

/**
 * Core AI Model Router
 * 
 * Responsible for dynamically selecting the optimal model based on query characteristics,
 * context length, and required capabilities.
 */
export class AIModelRouter {
  private models: Record<ModelTier, Record<string, ModelConfig>>;
  private threshold: number;
  private contextThresholds: typeof DEFAULT_CONTEXT_THRESHOLDS;
  private capabilityPatterns: Record<Capability, RegExp[]>;

  constructor(config?: {
    threshold?: number;
    contextThresholds?: Partial<typeof DEFAULT_CONTEXT_THRESHOLDS>;
  }) {
    this.threshold = config?.threshold ?? 0.6;
    this.contextThresholds = {
      ...DEFAULT_CONTEXT_THRESHOLDS,
      ...config?.contextThresholds,
    };
    
    // Initialize models map
    this.models = this.initializeModels();
    
    // Initialize capability detection patterns
    this.capabilityPatterns = this.initializeCapabilityPatterns();
  }

  /**
   * Initialize available models with their capabilities and parameters
   */
  private initializeModels(): Record<ModelTier, Record<string, ModelConfig>> {
    return {
      [ModelTier.BASELINE]: {
        "gpt4o_mini": {
          name: "gpt-4o-mini",
          provider: "openai",
          maxTokens: 4096,
          temperature: 0.7,
          supportsReasoning: false,
          supportsSearch: false,
          supportsComputerUse: false,
          contextWindow: 128000,
          streamingOptimized: true,
          specializedDomains: [],
          costTier: 1,
          apiConfig: {
            endpoint: "https://api.openai.com/v1/responses",
            apiVersion: "2024-02-15",
            responseFormat: "json"
          }
        },
        "claude_haiku": {
          name: "claude-3-5-haiku-latest",
          provider: "anthropic",
          maxTokens: 4096,
          temperature: 0.7,
          supportsReasoning: false,
          supportsSearch: false,
          supportsComputerUse: false,
          contextWindow: 200000,
          streamingOptimized: true,
          specializedDomains: [],
          costTier: 1,
          apiConfig: {
            endpoint: "https://api.anthropic.com/v1/messages",
            apiVersion: "2023-06-01",
            headers: {
              "anthropic-version": "2023-06-01"
            }
          }
        },
        "gemini_flash_lite": {
          name: "gemini-2.0-flash-lite",
          provider: "google",
          maxTokens: 2048,
          temperature: 0.7,
          supportsReasoning: false,
          supportsSearch: false,
          supportsComputerUse: false,
          contextWindow: 128000,
          streamingOptimized: true,
          specializedDomains: [],
          costTier: 1,
          apiConfig: {
            endpoint: "https://generativelanguage.googleapis.com/v1/models",
            params: {
              apiKey: "GOOGLE_API_KEY"
            }
          }
        }
      },
      [ModelTier.STANDARD]: {
        "gpt4o": {
          name: "gpt-4o-latest",
          provider: "openai",
          maxTokens: 8192,
          temperature: 0.7,
          supportsReasoning: true,
          supportsSearch: true,
          supportsComputerUse: false,
          contextWindow: 128000,
          streamingOptimized: true,
          specializedDomains: [],
          costTier: 2,
          apiConfig: {
            endpoint: "https://api.openai.com/v1/responses",
            apiVersion: "2024-02-15",
            responseFormat: "json"
          }
        },
        "claude_sonnet": {
          name: "claude-3-5-sonnet-latest",
          provider: "anthropic",
          maxTokens: 8192,
          temperature: 0.7,
          supportsReasoning: true,
          supportsSearch: false,
          supportsComputerUse: false,
          contextWindow: 200000,
          streamingOptimized: false,
          specializedDomains: [],
          costTier: 2,
          apiConfig: {
            endpoint: "https://api.anthropic.com/v1/messages",
            apiVersion: "2023-06-01",
            headers: {
              "anthropic-version": "2023-06-01"
            }
          }
        },
        "gemini_flash": {
          name: "gemini-2.0-flash",
          provider: "google",
          maxTokens: 8192,
          temperature: 0.7,
          supportsReasoning: false,
          supportsSearch: true,
          supportsComputerUse: false,
          contextWindow: 128000,
          streamingOptimized: true,
          specializedDomains: [],
          costTier: 2,
          apiConfig: {
            endpoint: "https://generativelanguage.googleapis.com/v1/models",
            params: {
              apiKey: "GOOGLE_API_KEY"
            }
          }
        },
        "perplexity_sonar": {
          name: "sonar",
          provider: "perplexity",
          maxTokens: 4096,
          temperature: 0.2,
          supportsReasoning: false,
          supportsSearch: true,
          supportsComputerUse: false,
          contextWindow: 128000,
          streamingOptimized: false,
          specializedDomains: ["search"],
          costTier: 2,
          apiConfig: {
            endpoint: "https://api.perplexity.ai/chat/completions"
          }
        }
      },
      [ModelTier.ADVANCED]: {
        "gpt41": {
          name: "gpt-4.1",
          provider: "openai",
          maxTokens: 16384,
          temperature: 0.7,
          supportsReasoning: true,
          supportsSearch: true,
          supportsComputerUse: true,
          contextWindow: 1047576,
          streamingOptimized: false,
          specializedDomains: [],
          costTier: 3,
          apiConfig: {
            endpoint: "https://api.openai.com/v1/responses",
            apiVersion: "2024-02-15",
            responseFormat: "json"
          }
        },
        "claude_37_sonnet": {
          name: "claude-3-7-sonnet-20250219",
          provider: "anthropic",
          maxTokens: 8192,
          temperature: 0.7,
          supportsReasoning: true,
          supportsSearch: false,
          supportsComputerUse: true,
          contextWindow: 200000,
          streamingOptimized: false,
          specializedDomains: [],
          costTier: 3,
          apiConfig: {
            endpoint: "https://api.anthropic.com/v1/messages",
            apiVersion: "2023-06-01",
            headers: {
              "anthropic-version": "2023-06-01"
            }
          }
        },
        "perplexity_sonar_pro": {
          name: "sonar-pro",
          provider: "perplexity",
          maxTokens: 4096,
          temperature: 0.2,
          supportsReasoning: false,
          supportsSearch: true,
          supportsComputerUse: false,
          contextWindow: 200000,
          streamingOptimized: false,
          specializedDomains: ["search"],
          costTier: 3,
          apiConfig: {
            endpoint: "https://api.perplexity.ai/chat/completions"
          }
        }
      },
      [ModelTier.SUPERIOR]: {
        "o1": {
          name: "o1",
          provider: "openai",
          maxTokens: 32768,
          temperature: 0.7,
          supportsReasoning: true,
          supportsSearch: true,
          supportsComputerUse: true,
          contextWindow: 200000,
          streamingOptimized: false,
          specializedDomains: ["reasoning", "planning"],
          costTier: 5,
          apiConfig: {
            endpoint: "https://api.openai.com/v1/responses",
            apiVersion: "2024-02-15",
            responseFormat: "json"
          }
        },
        "gemini_ultra": {
          name: "gemini-2.5-pro-exp-03-25",
          provider: "google",
          maxTokens: 32768,
          temperature: 0.7,
          supportsReasoning: true,
          supportsSearch: true,
          supportsComputerUse: false,
          contextWindow: 1000000,
          streamingOptimized: false,
          specializedDomains: ["reasoning", "math"],
          costTier: 4,
          apiConfig: {
            endpoint: "https://generativelanguage.googleapis.com/v1/models",
            params: {
              apiKey: "GOOGLE_API_KEY"
            }
          }
        },
        "grok3": {
          name: "grok-3-beta",
          provider: "xai",
          maxTokens: 16384,
          temperature: 0.7,
          supportsReasoning: false,
          supportsSearch: false,
          supportsComputerUse: false,
          contextWindow: 131072,
          streamingOptimized: false,
          specializedDomains: ["reasoning"],
          costTier: 4,
          apiConfig: {
            endpoint: "https://api.x.ai/v1/chat/completions"
          }
        },
        "perplexity_sonar_reasoning": {
          name: "sonar-reasoning-pro",
          provider: "perplexity",
          maxTokens: 8192,
          temperature: 0.2,
          supportsReasoning: true,
          supportsSearch: true,
          supportsComputerUse: false,
          contextWindow: 128000,
          streamingOptimized: false,
          specializedDomains: ["search", "reasoning"],
          costTier: 4,
          apiConfig: {
            endpoint: "https://api.perplexity.ai/chat/completions"
          }
        }
      },
      [ModelTier.SPECIALIZED]: {
        "o3_mini": {
          name: "o3-mini-2025-01-31",
          provider: "openai",
          maxTokens: 16384,
          temperature: 0.7,
          supportsReasoning: true,
          supportsSearch: false,
          supportsComputerUse: false,
          contextWindow: 200000,
          streamingOptimized: false,
          specializedDomains: ["math", "science", "reasoning"],
          costTier: 2,
          apiConfig: {
            endpoint: "https://api.openai.com/v1/responses",
            apiVersion: "2024-02-15",
            responseFormat: "json"
          }
        },
        "gpt4o_real": {
          name: "gpt-4o-realtime-preview",
          provider: "openai",
          maxTokens: 4096,
          temperature: 0.7,
          supportsReasoning: false,
          supportsSearch: false,
          supportsComputerUse: false,
          contextWindow: 128000,
          streamingOptimized: true,
          specializedDomains: ["realtime", "streaming"],
          costTier: 3,
          apiConfig: {
            endpoint: "https://api.openai.com/v1/responses",
            apiVersion: "2024-02-15"
          }
        },
        "gpt45": {
          name: "gpt-4.5-preview",
          provider: "openai",
          maxTokens: 16384,
          temperature: 0.7,
          supportsReasoning: true,
          supportsSearch: false,
          supportsComputerUse: false,
          contextWindow: 128000,
          streamingOptimized: false,
          specializedDomains: ["creative", "open-ended"],
          costTier: 4,
          apiConfig: {
            endpoint: "https://api.openai.com/v1/responses",
            apiVersion: "2024-02-15"
          }
        },
        "grok3_mini": {
          name: "grok-3-mini-beta",
          provider: "xai",
          maxTokens: 8192,
          temperature: 0.7,
          supportsReasoning: true,
          supportsSearch: false,
          supportsComputerUse: false,
          contextWindow: 131072,
          streamingOptimized: false,
          specializedDomains: ["reasoning", "math"],
          costTier: 1,
          apiConfig: {
            endpoint: "https://api.x.ai/v1/chat/completions"
          }
        },
        "tavily_search": {
          name: "tavily-search",
          provider: "tavily",
          maxTokens: 4096,
          temperature: 0.7,
          supportsReasoning: false,
          supportsSearch: true,
          supportsComputerUse: false,
          contextWindow: 4000,
          streamingOptimized: false,
          specializedDomains: ["search"],
          costTier: 1,
          apiConfig: {
            endpoint: "https://api.tavily.com/search"
          }
        }
      }
    };
  }

  /**
   * Initialize capability detection patterns
   */
  private initializeCapabilityPatterns(): Record<Capability, RegExp[]> {
    return {
      'REASONING': [
        /\breason\b/i, /\banalyze\b/i, /\bevaluate\b/i, /\bcompare\b/i,
        /\bcritique\b/i, /\bjudge\b/i, /\bconclusion\b/i, /\bstrategy\b/i
      ],
      'CODE': [
        /\bcode\b/i, /\bprogram\b/i, /\bfunction\b/i, /\bdebug\b/i, 
        /\bclass\b/i, /\bapi\b/i, /\bdevelop\b/i, /\balgorithm\b/i,
        /\breact\b/i, /\bjavascript\b/i, /\bpython\b/i, /\bsql\b/i
      ],
      'MATH': [
        /\bmath\b/i, /\bcalculate\b/i, /\bequation\b/i, /\bderivative\b/i,
        /\bprove\b/i, /\btheorem\b/i, /\bstatistics\b/i, /\balgebra\b/i
      ],
      'CREATIVITY': [
        /\bcreate\b/i, /\bgenerate\b/i, /\bwrite\b/i, /\bdesign\b/i,
        /\bstory\b/i, /\bpoem\b/i, /\bcreative\b/i, /\bimagine\b/i
      ],
      'KNOWLEDGE': [
        /\bexplain\b/i, /\bwhat is\b/i, /\bdescribe\b/i, /\bdefine\b/i,
        /\bhistory\b/i, /\bscience\b/i, /\bfacts\b/i, /\binformation\b/i
      ],
      'SEARCH': [
        /\bsearch\b/i, /\bfind online\b/i, /\bcurrent\b/i, /\blatest\b/i,
        /\brecent\b/i, /\bnews\b/i, /\btoday\b/i, /\bupdated\b/i
      ],
      'COMPUTER_USE': [
        /\buse computer\b/i, /\bcontrol browser\b/i, /\bautomation\b/i,
        /\binteract with\b/i, /\bwebsite\b/i, /\bbrowse\b/i
      ],
      'LONG_CONTEXT': [
        /\bdocument\b/i, /\blong\b/i, /\bextensive\b/i, /\bthorough\b/i,
        /\bcomprehensive\b/i, /\bdetailed\b/i, /\bcomplete\b/i
      ],
      'REALTIME': [
        /\bquick\b/i, /\bfast\b/i, /\bimmediate\b/i, /\binstant\b/i,
        /\breal-?time\b/i, /\bresponsive\b/i, /\brapid\b/i
      ]
    };
  }

  /**
   * Assess the complexity of a query on a scale of 0 to 1
   */
  public assessComplexity(query: string): number {
    // Basic metrics
    const wordCount = query.split(/\s+/).length;
    const sentenceCount = (query.match(/[.!?]+/g) || []).length + 1;
    // const avgWordLength = query.split(/\s+/).reduce((acc, word) => acc + word.length, 0) / Math.max(wordCount, 1); // Removed unused variable
    
    // Complexity indicators
    const technicalTerms = [
      'algorithm', 'function', 'implementation', 'integration',
      'architecture', 'framework', 'optimization', 'database',
      'interface', 'recursion', 'middleware', 'scalability',
      'infrastructure', 'asynchronous', 'parallelization'
    ];
    
    const technicalTermCount = technicalTerms.reduce((count, term) => {
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      return count + (regex.test(query) ? 1 : 0);
    }, 0);
    
    const questionDepthIndicators = [
      'why', 'how', 'explain', 'analyze', 'compare', 
      'evaluate', 'synthesize', 'examine', 'investigate'
    ];
    
    const questionDepth = questionDepthIndicators.reduce((count, indicator) => {
      const regex = new RegExp(`\\b${indicator}\\b`, 'i');
      return count + (regex.test(query) ? 1 : 0);
    }, 0);

    // Calculate complexity score (0-1)
    let complexityScore = 0;
    
    // Word count contribution (0.0-0.2)
    const wordCountScore = Math.min(wordCount / 100, 1) * 0.2;
    
    // Sentence structure contribution (0.0-0.2)
    const avgWordsPerSentence = wordCount / Math.max(sentenceCount, 1);
    const sentenceScore = Math.min(avgWordsPerSentence / 20, 1) * 0.2;
    
    // Technical vocabulary contribution (0.0-0.3)
    const technicalScore = Math.min(technicalTermCount / 3, 1) * 0.3;
    
    // Question complexity contribution (0.0-0.3)
    const questionScore = Math.min(questionDepth / 2, 1) * 0.3;
    
    // Calculate final score, ensuring it's in 0-1 range
    complexityScore = wordCountScore + sentenceScore + technicalScore + questionScore;
    return Math.min(Math.max(complexityScore, 0), 1);
  }

  /**
   * Calculate a score for a model based on capabilities and context size.
   */
  private calculateModelScore(
    model: ModelConfig,
    capabilities: Capability[],
    contextSize: number,
    taskType: string
  ): number {
    let score = 0;

    // Context window capacity check (essential)
    if (model.contextWindow < contextSize) {
      return -1; // Indicate model is unsuitable
    }
    score += 2; // Base score for meeting context requirement

    // Capability support scoring
    capabilities.forEach(capability => {
      if (capability === 'REASONING' && model.supportsReasoning) score += 2;
      if (capability === 'SEARCH' && model.supportsSearch) score += 2;
      if (capability === 'COMPUTER_USE' && model.supportsComputerUse) score += 2;
    });

    // Specialized domain match scoring
    if (model.specializedDomains.some(domain => domain.toLowerCase() === taskType.toLowerCase())) {
      score += 3;
    }

    // Streaming optimization scoring (if needed)
    if (capabilities.includes('REALTIME') && model.streamingOptimized) {
      score += 2;
    }

    return score;
  }

  /**
   * Detect required capabilities from the query
   */
  public detectCapabilities(query: string): Capability[] {
    const detectedCapabilities: Set<Capability> = new Set();
    
    // Check each capability pattern
    for (const [capability, patterns] of Object.entries(this.capabilityPatterns)) {
      const matchesAnyPattern = patterns.some(pattern => pattern.test(query));
      if (matchesAnyPattern) {
        detectedCapabilities.add(capability as Capability);
      }
    }
    
    // Add implicit capabilities based on query characteristics
    const wordCount = query.split(/\s+/).length;
    if (wordCount > 100) {
      detectedCapabilities.add('LONG_CONTEXT');
    }
    
    return Array.from(detectedCapabilities);
  }

  /**
   * Classify the question type
   */
  public classifyQuestion(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (/\b(how|why|explain)\b/i.test(lowerQuery)) {
      return 'procedural';
    }
    if (/\b(what|who|where|when)\b/i.test(lowerQuery)) {
      return 'factual';
    }
    if (/^(is|are|can|do|does)\b/i.test(lowerQuery)) {
      return 'yes_no';
    }
    if (/\b(compare|contrast|analyze|evaluate)\b/i.test(lowerQuery)) {
      return 'analytical';
    }
    if (/\b(hi|hello|hey|how are you)\b/i.test(lowerQuery)) {
      return 'casual';
    }
    if (/\b(create|write|generate|make)\b/i.test(lowerQuery)) {
      return 'creative';
    }
    if (/\b(code|function|program)\b/i.test(lowerQuery)) {
      return 'coding';
    }
    return 'general';
  }

  /**
   * Determine the task type based on the query
   */
  public determineTaskType(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (/\b(code|function|program|algorithm|debug)\b/i.test(lowerQuery)) {
      return 'coding';
    }
    if (/\b(analyze|compare|evaluate|assess)\b/i.test(lowerQuery)) {
      return 'analysis';
    }
    if (/\b(create|write|generate|design)\b/i.test(lowerQuery)) {
      return 'creative';
    }
    if (/\b(search|find|latest|current|updated)\b/i.test(lowerQuery)) {
      return 'search';
    }
    if (/\b(math|calculate|equation|formula|solve)\b/i.test(lowerQuery)) {
      return 'math';
    }
    if (/\b(explain|what is|tell me about|describe)\b/i.test(lowerQuery)) {
      return 'educational';
    }
    return 'general';
  }

  /**
   * Get response strategy based on question type and task type
   */
  private getResponseStrategy(questionType: string, taskType: string): string {
    switch (questionType) {
      case 'procedural':
        return 'step_by_step_explanation';
      case 'factual':
        return 'direct_answer';
      case 'yes_no':
        return 'binary_with_explanation';
      case 'analytical':
        return 'comparative_analysis';
      case 'casual':
        return 'conversational';
      case 'creative':
        return 'creative_generation';
      case 'coding':
        return 'code_with_explanation';
    }
    
    // If question type doesn't suggest a strategy, use task type
    switch (taskType) {
      case 'coding':
        return 'code_with_explanation';
      case 'analysis':
        return 'analytical_framework';
      case 'creative':
        return 'creative_generation';
      case 'search':
        return 'search_and_synthesize';
      case 'math':
        return 'step_by_step_solution';
      case 'educational':
        return 'conceptual_explanation';
      default:
        return 'balanced_response';
    }
  }

  /**
   * Calculate the appropriate model tier based on complexity and capabilities
   */
  private calculateModelTier(complexity: number, capabilities: Capability[]): ModelTier {
    // Very complex queries need a superior model
    if (complexity > 0.8) {
      return ModelTier.SUPERIOR;
    }
    
    // Check for specialized requirements
    const hasSpecializedNeeds = capabilities.some(cap => 
      ['MATH', 'COMPUTER_USE', 'SEARCH'].includes(cap)
    );
    if (hasSpecializedNeeds) {
      return ModelTier.SPECIALIZED;
    }
    
    // Complex reasoning
    if (complexity > 0.6 || capabilities.includes('REASONING')) {
      return ModelTier.ADVANCED;
    }
    
    // Medium complexity or creative needs
    if (complexity > 0.4 || capabilities.includes('CREATIVITY') || capabilities.includes('CODE')) {
      return ModelTier.STANDARD;
    }
    
    // Default to baseline for simpler queries
    return ModelTier.BASELINE;
  }

  /**
   * Find the best model for a specified tier and capabilities
   */
  private findBestModelForTier(
    tier: ModelTier,
    capabilities: Capability[],
    contextSize: number
  ): ModelConfig {
    const tierModels = this.models[tier];
    let bestModel: ModelConfig | null = null;
    let bestScore = -1;
    const taskType = this.determineTaskType(capabilities.join(' ')); // Determine task type once

    for (const [, model] of Object.entries(tierModels)) {
      const score = this.calculateModelScore(model, capabilities, contextSize, taskType);

      // Skip unsuitable models or those with lower scores
      if (score === -1 || score < bestScore) {
        continue;
      }

      // Update best model if score is higher, or if score is equal but cost is lower
      if (score > bestScore || (score === bestScore && model.costTier < (bestModel?.costTier ?? Infinity))) {
        bestScore = score;
        bestModel = model;
      }
    }
    
    // If no suitable model found in this tier, fallback to default
    if (!bestModel) {
      const fallbackModel = Object.values(tierModels)[0];
      if (fallbackModel) {
        return fallbackModel;
      }
      
      // If no models in the tier, fall back to a lower tier
      if (tier !== ModelTier.BASELINE) {
        const lowerTier = [
          ModelTier.ADVANCED, 
          ModelTier.STANDARD, 
          ModelTier.BASELINE
        ].find(t => t < tier) || ModelTier.BASELINE;
        
        return this.findBestModelForTier(lowerTier, capabilities, contextSize);
      }
      
      // Last resort - just use the first model we can find
      const anyModel = Object.values(this.models)
        .flatMap(tierModels => Object.values(tierModels))
        .find(model => model.contextWindow >= contextSize);
        
      if (anyModel) {
        return anyModel;
      }
      
      throw new Error("No suitable model found for the current request");
    }
    
    return bestModel;
  }

  /**
   * Route the request to the optimal model based on query characteristics
   */
  public route(query: string, contextLength: number = 0): AIRouterResult {
    // 1. Assess complexity
    const complexity = this.assessComplexity(query);
    
    // 2. Detect required capabilities
    const capabilities = this.detectCapabilities(query);
    
    // 3. Determine task and question types
    const taskType = this.determineTaskType(query);
    const questionType = this.classifyQuestion(query);
    
    // 4. Calculate appropriate model tier
    const modelTier = this.calculateModelTier(complexity, capabilities);
    
    // 5. Select best model based on tier and capabilities
    const model = this.findBestModelForTier(modelTier, capabilities, contextLength);
    
    // 6. Determine response strategy
    const responseStrategy = this.getResponseStrategy(questionType, taskType);
    
    // 7. Prepare explanation
    const routingExplanation = this.generateRoutingExplanation(
      model, 
      modelTier, 
      complexity, 
      capabilities, 
      taskType
    );
    
    // 8. Return result
    return {
      model,
      modelTier,
      complexity,
      taskType,
      questionType,
      capabilities,
      responseStrategy,
      routingExplanation
    };
  }

  /**
   * Generate human-readable explanation for routing decision
   */
  private generateRoutingExplanation(
    model: ModelConfig,
    tier: ModelTier,
    complexity: number,
    capabilities: Capability[],
    taskType: string
  ): string {
    let complexityLevel: string;
    if (complexity < 0.3) {
      complexityLevel = "simple";
    } else if (complexity < 0.5) {
      complexityLevel = "moderate";
    } else if (complexity < 0.7) {
      complexityLevel = "significant";
    } else if (complexity < 0.9) {
      complexityLevel = "high";
    } else {
      complexityLevel = "very high";
    }
      
    const capabilitiesText = capabilities.length > 0 
      ? `requiring capabilities: ${capabilities.join(', ')}`
      : "";
      
    return `Selected ${model.name} (${model.provider}) for ${complexityLevel} complexity ${taskType} task ${capabilitiesText}. This model has a ${model.contextWindow / 1000}k context window with a cost tier of ${model.costTier}/5.`;
  }
}
