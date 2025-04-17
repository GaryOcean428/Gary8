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
  capabilities?: string[];
}

export class ModelRouter {
  private readonly threshold = 0.63;
  private readonly models = {
    // OpenAI Models
    gpt4o: 'gpt-4o',
    gpt4oMini: 'gpt-4o-mini',
    o1: 'o1',
    o1Mini: 'o1-mini',
    o3Mini: 'o3-mini-2025-01-31',
    gpt45: 'gpt-4.5-preview',
    
    // Anthropic Models
    claude37: 'claude-3-7-sonnet-20250219',
    claude35: 'claude-3.5-sonnet-latest',
    claudeHaiku: 'claude-3.5-haiku-latest',
    
    // Groq Models
    llama33: 'llama-3.3-70b-versatile',
    llamaVision: 'llama-3.2-90b-vision-preview',
    
    // Grok Models
    grok3: 'grok-3-latest',
    grok3Mini: 'grok-3-mini-latest',
    
    // Search-optimized models
    sonarPro: 'sonar-reasoning-pro'
  };

  async route(query: string, history: Message[]): Promise<RouterConfig> {
    thoughtLogger.log('reasoning', 'Analyzing query for model selection');

    const complexity = this.assessComplexity(query);
    const contextLength = this.calculateContextLength(history);
    const requiresSearch = this.requiresSearch(query);
    const requiresCode = this.requiresCodeExecution(query);
    const requiresCreative = this.requiresCreative(query);
    const requiresReasoning = this.requiresReasoning(query);
    const questionType = this.classifyQuestion(query);
    const capabilities = this.detectCapabilities(query);
    const isCasualGreeting = this.isCasualGreeting(query);

    thoughtLogger.log('observation', 'Query analysis complete', {
      complexity,
      contextLength,
      requiresSearch,
      requiresCode,
      requiresCreative,
      requiresReasoning,
      questionType,
      capabilities,
      isCasualGreeting
    });

    const consideredModels: string[] = [];
    
    // Handle casual greetings with most efficient model
    if (isCasualGreeting) {
      consideredModels.push(this.models.claudeHaiku, this.models.gpt4oMini);
      return {
        model: this.models.claudeHaiku,
        maxTokens: 2048, // Lower tokens for simple responses
        temperature: 0.7,
        confidence: 0.95,
        responseStrategy: 'casual_conversation',
        routingExplanation: 'Casual greeting detected, using efficient Claude 3.5 Haiku model',
        questionType: 'casual',
        consideredModels
      };
    }

    // For search-related queries that genuinely need up-to-date information
    if (requiresSearch && this.isGenuineSearchQuery(query)) {
      consideredModels.push(this.models.sonarPro);
      return {
        model: this.models.sonarPro,
        maxTokens: 4096,
        temperature: 0.7,
        confidence: 0.9,
        responseStrategy: 'search_and_synthesize',
        routingExplanation: 'Search query with need for current information detected, using Perplexity model',
        questionType,
        consideredModels,
        capabilities: ['web_search', 'information_synthesis']
      };
    }

    // For code-related tasks, use models that excel at coding
    if (requiresCode) {
      consideredModels.push(this.models.claude37, this.models.o1);
      
      // Choose between models based on complexity and context length
      if (complexity > 0.7 || contextLength > 10000) {
        return {
          model: this.models.claude37,
          maxTokens: 16384,
          temperature: 0.5, // Lower temperature for more precise code
          confidence: 0.9,
          responseStrategy: 'code_generation',
          routingExplanation: 'Complex code task detected, using Claude 3.7 for precise code generation',
          questionType,
          consideredModels,
          capabilities: ['code_generation', 'technical_analysis']
        };
      } else {
        return {
          model: this.models.o1Mini,
          maxTokens: 8192,
          temperature: 0.6,
          confidence: 0.85,
          responseStrategy: 'code_generation',
          routingExplanation: 'Code task detected, using o1-mini for efficient code generation',
          questionType,
          consideredModels,
          capabilities: ['code_generation']
        };
      }
    }

    // For creative tasks, use models good at creative content
    if (requiresCreative) {
      consideredModels.push(this.models.gpt45, this.models.claudeHaiku);
      return {
        model: this.models.gpt45,
        maxTokens: 8192,
        temperature: 0.8, // Higher temperature for more creative outputs
        confidence: 0.85,
        responseStrategy: 'creative_generation',
        routingExplanation: 'Creative task detected, using GPT-4.5 for creative content generation',
        questionType,
        consideredModels,
        capabilities: ['creative_writing', 'idea_generation']
      };
    }

    // For complex reasoning tasks, use reasoning-optimized models
    if (requiresReasoning && complexity > 0.6) {
      consideredModels.push(this.models.o1, this.models.claude37);
      return {
        model: this.models.o1,
        maxTokens: 16384,
        temperature: 0.6,
        confidence: 0.9,
        responseStrategy: 'chain_of_thought',
        routingExplanation: 'Complex reasoning task detected, using o1 for advanced reasoning capabilities',
        questionType,
        consideredModels,
        capabilities: ['logical_reasoning', 'structured_thinking']
      };
    }

    // Standard routing based on complexity and context length
    if (complexity < 0.3 && contextLength < 2000) {
      consideredModels.push(this.models.claudeHaiku, this.models.gpt4oMini);
      return {
        model: this.models.gpt4oMini,
        maxTokens: 4096,
        temperature: 0.7,
        confidence: 0.8,
        responseStrategy: this.getResponseStrategy(questionType),
        routingExplanation: 'Simple query detected, using efficient GPT-4o Mini model',
        questionType,
        consideredModels
      };
    }

    if (complexity < 0.6 && contextLength < 8000) {
      consideredModels.push(this.models.gpt4o, this.models.llama33);
      return {
        model: this.models.gpt4o,
        maxTokens: 8192,
        temperature: 0.7,
        confidence: 0.85,
        responseStrategy: this.getResponseStrategy(questionType),
        routingExplanation: 'Moderate complexity detected, using balanced GPT-4o model',
        questionType,
        consideredModels
      };
    }

    if (complexity < 0.8 || contextLength < 16000) {
      consideredModels.push(this.models.gpt4o, this.models.claude35);
      return {
        model: this.models.claude35,
        maxTokens: 16384,
        temperature: 0.7,
        confidence: 0.85,
        responseStrategy: this.getResponseStrategy(questionType),
        routingExplanation: 'High complexity detected, using advanced Claude 3.5 Sonnet model',
        questionType,
        consideredModels
      };
    }

    consideredModels.push(this.models.claude37, this.models.o1);
    return {
      model: this.models.claude37,
      maxTokens: 24576, // High token limit for complex tasks
      temperature: 0.7,
      confidence: 0.95,
      responseStrategy: this.getResponseStrategy(questionType),
      routingExplanation: 'Very complex query detected, using top-tier Claude 3.7 Sonnet model',
      questionType,
      consideredModels
    };
  }

  private getResponseStrategy(questionType: string): string {
    switch (questionType) {
      case 'problem_solving':
        return 'chain_of_thought';
      case 'factual':
        return 'direct_answer';
      case 'yes_no':
        return 'boolean_with_explanation';
      case 'analysis':
        return 'comparative_analysis';
      case 'casual':
        return 'casual_conversation';
      default:
        return 'open_discussion';
    }
  }

  /**
   * Assesses the complexity of a query based on multiple factors
   * Returns a score between 0 and 1, where higher values indicate greater complexity
   */
  private assessComplexity(query: string): number {
    const factors = {
      // Base length factor, maxes out at 500 characters
      length: Math.min(query.length / 500, 0.8),
      
      // Question complexity factors
      questionCount: Math.min((query.match(/\?/g) || []).length * 0.2, 0.6), // Multiple questions increase complexity
      questionWords: Math.min((query.match(/\b(how|why|what|when|where|who)\b/gi) || []).length * 0.08, 0.4),
      
      // Technical content indicators
      technicalTerms: Math.min((query.match(/\b(algorithm|function|process|system|analyze|evaluate|compare|implement|architecture|framework|infrastructure|methodology)\b/gi) || []).length * 0.12, 0.6),
      codeRelated: /\b(code|program|debug|function|api|class|method|algorithm)\b/i.test(query) ? 0.25 : 0,
      
      // Structural complexity indicators
      multipleSteps: Math.min((query.match(/\b(and|then|after|before|finally|first|second|third|next|last)\b/gi) || []).length * 0.08, 0.4),
      complexStructures: Math.min((query.match(/\b(if|else|while|for|switch|case|however|although|despite|nevertheless|furthermore|moreover)\b/gi) || []).length * 0.12, 0.5),
      
      // Domain-specific complexity
      domainSpecific: Math.min((query.match(/\b(quantum|neural|genome|blockchain|cryptocurrency|theorem|philosophy|molecular|theoretical|computational|statistical|mathematical)\b/gi) || []).length * 0.15, 0.6)
    };

    // Calculate weighted sum of factors
    const weightedSum = Object.values(factors).reduce((sum, value) => sum + value, 0);
    
    // Normalize to 0-1 range, capping at 1
    return Math.min(weightedSum / 4, 1);
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
      'execute',
      'class',
      'method',
      'API',
      'script',
      'module',
      'library',
      'framework'
    ];

    const queryLower = query.toLowerCase();
    
    // Count code keywords
    const keywordMatches = codeKeywords.filter(keyword => 
      queryLower.includes(keyword.toLowerCase())
    ).length;
    
    // Check for code block markers
    const containsCodeBlock = query.includes('```');
    const containsCodePatterns = /\b(if|for|while|class|def|function|var|const|let)\b/.test(queryLower);
    
    // More specific checks for programming tasks
    const programmingIntent = /\bwrite (a|some|the)? code\b|create (a|some|the)? (function|class|script|program)/i.test(query);
    
    return keywordMatches >= 2 || containsCodeBlock || containsCodePatterns || programmingIntent;
  }

  /**
   * Determines if a query requires search for up-to-date information
   * Uses more specific patterns to avoid over-triggering on common questions
   */
  private requiresSearch(query: string): boolean {
    const queryLower = query.toLowerCase();
    
    // Explicit search intent keywords
    const explicitSearchKeywords = [
      'search for',
      'look up',
      'find information',
      'search the web',
      'search online',
      'browse for'
    ];
    
    // Time-sensitive keywords that suggest need for current information
    const timeSensitiveKeywords = [
      'latest',
      'newest',
      'current',
      'recent',
      'up to date',
      'today\'s',
      'this week\'s',
      'this year\'s'
    ];
    
    // News/update related keywords
    const newsKeywords = [
      'news',
      'headline',
      'announcement',
      'update',
      'development',
      'breaking'
    ];
    
    // Check for explicit search intent
    const hasExplicitSearchIntent = explicitSearchKeywords.some(term => queryLower.includes(term));
    
    // Check for time-sensitive information need
    const needsCurrentInfo = timeSensitiveKeywords.some(term => queryLower.includes(term));
    
    // Check for news-related queries
    const isNewsQuery = newsKeywords.some(term => queryLower.includes(term));
    
    // Check for specific temporal references that require current information
    const hasTemporalReference = /\b(today|yesterday|this week|this month|this year|currently|now)\b/.test(queryLower);
    
    // Better pattern for current events that avoids matching simple factual questions
    const isCurrentEventQuery = (hasTemporalReference || needsCurrentInfo) && 
                               (/\b(what is happening|what's happening|what has happened|what occurred)\b/.test(queryLower) ||
                                isNewsQuery);
    
    return hasExplicitSearchIntent || isCurrentEventQuery || (isNewsQuery && hasTemporalReference);
  }
  
  /**
   * Additional check to confirm if a query genuinely needs search capabilities
   * Provides a second filter to prevent over-selection of search models
   */
  private isGenuineSearchQuery(query: string): boolean {
    const queryLower = query.toLowerCase();
    
    // Patterns that indicate the query doesn't actually need search
    const nonSearchPatterns = [
      // General knowledge questions that don't need current information
      /\bwhat is the (meaning|definition|purpose) of\b/i,
      /\bhow (do|does|can) .* work\b/i,
      /\bexplain .* to me\b/i,
      /\bteach me about\b/i,
      
      // Programming questions that don't need web search
      /\bhow (do|to) (I|you) (code|program|implement|write code for)\b/i,
      
      // Conversational questions
      /\bwhat (do you think|is your opinion|are your thoughts)\b/i,
      
      // Help requests that don't need search
      /\bhelp me (with|understand|learn)\b/i
    ];
    
    // Check if query matches patterns that don't require search
    const matchesNonSearchPattern = nonSearchPatterns.some(pattern => pattern.test(queryLower));
    
    // Named entity recognition to detect if query is about a person, place, or thing
    // This is a simple approach - in a real system you'd use NER libraries
    const containsNamedEntity = /\b([A-Z][a-z]+ )+[A-Z][a-z]+\b/.test(query);
    
    // Keywords that strongly indicate need for search even for general knowledge
    const strongSearchIndicators = [
      'latest version',
      'current price',
      'recent studies',
      'new research',
      'upcoming event',
      'just announced',
      'breaking news'
    ];
    
    const hasStrongSearchIndicator = strongSearchIndicators.some(term => queryLower.includes(term));
    
    // If query matches non-search patterns and doesn't have strong search indicators,
    // it probably doesn't need search
    if (matchesNonSearchPattern && !hasStrongSearchIndicator) {
      return false;
    }
    
    // If query contains named entities AND time references or is explicitly about current info,
    // it probably does need search
    if (containsNamedEntity && (/\b(current|latest|recent|today|now)\b/.test(queryLower) || hasStrongSearchIndicator)) {
      return true;
    }
    
    // Default to trusting the initial requiresSearch assessment
    return true;
  }
  
  private requiresCreative(query: string): boolean {
    const creativeKeywords = [
      'creative',
      'write',
      'story',
      'poem',
      'fiction',
      'imagine',
      'create',
      'design',
      'invent',
      'generate',
      'compose',
      'draft',
      'brainstorm',
      'ideate'
    ];
    
    const queryLower = query.toLowerCase();
    
    // Check for explicit creative content requests
    const explicitCreativeRequest = /\bwrite (a|an|some) (story|poem|essay|article|script|narrative|song|novel)/i.test(query);
    
    // Check for creative ideation requests
    const ideationRequest = /\b(come up with|brainstorm|think of|generate|create) (some|a few|many|multiple|several|creative|unique|original) (ideas|concepts|options|possibilities)/i.test(query);
    
    return creativeKeywords.some(keyword => queryLower.includes(keyword)) || 
           explicitCreativeRequest || 
           ideationRequest;
  }
  
  private requiresReasoning(query: string): boolean {
    const reasoningKeywords = [
      'explain',
      'analyze',
      'evaluate',
      'compare',
      'contrast',
      'deduce',
      'infer',
      'reason',
      'logic',
      'argument',
      'perspective',
      'pros and cons',
      'advantages and disadvantages',
      'implications'
    ];
    
    const queryLower = query.toLowerCase();
    
    // Check for explicit reasoning tasks
    const explicitReasoningTask = /\b(analyze|evaluate|compare|contrast) (the|this|these|those|between|among)\b/i.test(query);
    
    // Check for deep explanation requests
    const deepExplanationRequest = /\b(explain|elaborate on|describe in detail) (how|why|what|when|where)\b/i.test(query);
    
    // Check for complex question structures that suggest reasoning
    const complexQuestionStructure = /\bwhy (is|are|does|do|would|should|could|might) .+ (if|when|while|although|despite|however|nevertheless)\b/i.test(query);
    
    return reasoningKeywords.some(keyword => queryLower.includes(keyword)) || 
           explicitReasoningTask || 
           deepExplanationRequest || 
           complexQuestionStructure;
  }

  /**
   * Checks if a query is a casual greeting that can be handled by a lighter model
   */
  private isCasualGreeting(query: string): boolean {
    const greetingPatterns = [
      /^(hi|hello|hey|greetings|good morning|good afternoon|good evening)( there)?!?$/i,
      /^how are you( doing| today)?(\?|!)?$/i,
      /^what'?s up(\?|!)?$/i,
      /^yo!?$/i,
      /^(hi|hello|hey),? (there |)?(Claude|Assistant|AI)!?$/i
    ];
    
    return greetingPatterns.some(pattern => pattern.test(query.trim()));
  }

  private classifyQuestion(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    // Check for casual greetings first
    // Check for casual greetings first
    if (this.isCasualGreeting(query)) {
      return 'casual';
    }
    
    // Problem-solving questions
    if (/\b(how|why|explain|solve|fix|resolve|approach|handle|address)\b/.test(lowerQuery)) {
      return 'problem_solving';
    }
    
    // Factual questions
    if (/\b(what|who|where|when|which|list|tell me about|give me information|provide details)\b/.test(lowerQuery)) {
      return 'factual';
    }
    
    // Yes/no questions typically start with certain verbs
    if (/^(is|are|can|do|does|has|have|will|would|should|could|might|must|may)\b/.test(lowerQuery)) {
      return 'yes_no';
    }
    
    // Analysis questions
    if (/\b(compare|contrast|analyze|evaluate|assess|review|examine|investigate|study)\b/.test(lowerQuery)) {
      return 'analysis';
    }
    
    // Default to open-ended if no specific pattern matches
    return 'open_ended';
  }

  private detectCapabilities(query: string): string[] {
    const capabilities: string[] = [];
    const queryLower = query.toLowerCase();
    
    // Web search
    if (this.requiresSearch(query) && this.isGenuineSearchQuery(query)) {
      capabilities.push('web_search');
    }
    
    // Code generation
    if (this.requiresCodeExecution(query)) {
      capabilities.push('code_generation');
    }
    
    // Data analysis
    if (/\b(analyze|data|statistics|chart|graph|trend|metrics|dataset|spreadsheet|csv|excel)\b/.test(queryLower)) {
      capabilities.push('data_analysis');
    }
    
    // Creative writing
    if (this.requiresCreative(query)) {
      capabilities.push('creative_writing');
    }
    
    // Logical reasoning
    if (this.requiresReasoning(query)) {
      capabilities.push('logical_reasoning');
    }
    
    // Mathematical calculation
    if (/\b(calculate|compute|solve|equation|formula|math problem|arithmetic|algebra|calculus)\b/.test(queryLower)) {
      capabilities.push('mathematical_calculation');
    }
    
    // Language translation
    if (/\b(translate|translation|convert to .* language)\b/.test(queryLower)) {
      capabilities.push('language_translation');
    }
    
    // Summarization
    if (/\b(summarize|summary|condense|tl;dr|tldr|recap|brief overview)\b/.test(queryLower)) {
      capabilities.push('summarization');
    }
    
    return capabilities;
  }
}

// Export singleton instance
export const modelRouter = new ModelRouter();