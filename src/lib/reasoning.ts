import { XAIClient } from './xai';
import { config } from './config';

export type ReasoningStrategy = 
  | 'none' 
  | 'chain-of-thought'
  | 'tree-of-thought'
  | 'self-reflection';

export interface ReasoningStep {
  type: 'thought' | 'action' | 'reflection';
  content: string;
}

export class ReasoningEngine {
  private xai: XAIClient;

  constructor() {
    this.xai = new XAIClient(config.apiKey);
  }

  async reason(
    query: string, 
    strategy: ReasoningStrategy = 'chain-of-thought'
  ): Promise<ReasoningStep[]> {
    if (strategy === 'none') {
      return [];
    }

    const systemPrompt = this.getStrategyPrompt(strategy);
    const response = await this.xai.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query }
    ]);

    return this.parseReasoningSteps(response);
  }

  private getStrategyPrompt(strategy: ReasoningStrategy): string {
    switch (strategy) {
      case 'chain-of-thought':
        return `Break down the problem into sequential steps. For each step:
1. Think about what needs to be done
2. Explain your reasoning
3. State your conclusion
Format: [THOUGHT] ... [ACTION] ... [REFLECTION] ...`;

      case 'tree-of-thought':
        return `Explore multiple solution paths:
1. Consider different approaches
2. Evaluate pros and cons
3. Choose the most promising path
4. Explain your decision
Format: [THOUGHT] ... [ACTION] ... [REFLECTION] ...`;

      case 'self-reflection':
        return `After each step:
1. Review your reasoning
2. Question your assumptions
3. Consider alternatives
4. Refine your approach
Format: [THOUGHT] ... [ACTION] ... [REFLECTION] ...`;

      default:
        return '';
    }
  }

  private parseReasoningSteps(response: string): ReasoningStep[] {
    const steps: ReasoningStep[] = [];
    const regex = /\[(THOUGHT|ACTION|REFLECTION)\]\s*([^\[]+)/g;
    
    let match;
    while ((match = regex.exec(response)) !== null) {
      steps.push({
        type: match[1].toLowerCase() as ReasoningStep['type'],
        content: match[2].trim()
      });
    }

    return steps;
  }

  selectStrategy(query: string, complexity: number): ReasoningStrategy {
    // Simple queries don't need reasoning
    if (complexity < 0.3) {
      return 'none';
    }

    // Check query characteristics
    const needsMultiplePaths = /\b(compare|alternative|different ways|options)\b/i.test(query);
    const needsVerification = /\b(verify|check|confirm|ensure)\b/i.test(query);
    
    if (needsMultiplePaths) {
      return 'tree-of-thought';
    }
    if (needsVerification || complexity > 0.7) {
      return 'self-reflection';
    }
    
    return 'chain-of-thought';
  }
}