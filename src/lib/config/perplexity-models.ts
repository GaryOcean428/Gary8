/**
 * Perplexity AI models configuration
 */
export const perplexityModels = {
  // Chat completion models
  sonarDeepResearch: 'sonar-deep-research', // 128k context, advanced research capabilities
  sonarReasoningPro: 'sonar-reasoning-pro', // 128k context, advanced reasoning with search
  sonarReasoning: 'sonar-reasoning', // 128k context, standard reasoning with search
  sonarPro: 'sonar-pro', // 200k context, advanced features
  sonar: 'sonar', // 128k context, standard features
};

/**
 * Get a Perplexity model by name
 * @param modelName The model name
 * @returns The model ID or undefined if not found
 */
export function getPerplexityModel(modelName: string): string | undefined {
  const modelMap: Record<string, string> = {
    'sonar-deep-research': perplexityModels.sonarDeepResearch,
    'sonar-reasoning-pro': perplexityModels.sonarReasoningPro,
    'sonar-reasoning': perplexityModels.sonarReasoning,
    'sonar-pro': perplexityModels.sonarPro,
    'sonar': perplexityModels.sonar,
  };
  
  return modelMap[modelName];
}

/**
 * Get context window size for a model
 * @param modelName The model name
 * @returns The context window size in tokens
 */
export function getModelContextWindow(modelName: string): number {
  const contextMap: Record<string, number> = {
    'sonar-deep-research': 128000,
    'sonar-reasoning-pro': 128000,
    'sonar-reasoning': 128000,
    'sonar-pro': 200000,
    'sonar': 128000,
  };
  
  return contextMap[modelName] || 128000; // Default to 128k
}