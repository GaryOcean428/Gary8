import { Message } from '../types';
import { thoughtLogger } from '../logging/thought-logger';

interface EnhancementRule {
  pattern: RegExp;
  enhance: (match: RegExpMatchArray, message: Message) => string;
}

export class ContextEnhancer {
  private static instance: ContextEnhancer;
  private rules: EnhancementRule[] = [];

  private constructor() {
    this.initializeRules();
  }

  static getInstance(): ContextEnhancer {
    if (!ContextEnhancer.instance) {
      ContextEnhancer.instance = new ContextEnhancer();
    }
    return ContextEnhancer.instance;
  }

  private initializeRules(): void {
    this.rules = [
      // Code-related context
      {
        pattern: /```[\s\S]*?```/g,
        enhance: (match, message) => {
          const code = match[0].replace(/```(\w+)?\n?/, '').replace(/```$/, '');
          return `[Code Block] Language context: The user is working with code. Previous code snippet:\n${code}`;
        }
      },
      // Technical terms
      {
        pattern: /\b(api|function|component|database|server|client|endpoint)\b/gi,
        enhance: (match) => `[Technical Context] The conversation involves technical concepts, specifically: ${match[0]}`
      },
      // Questions and inquiries
      {
        pattern: /\b(how|what|why|when|where|who|can you|could you)\b.*\?/gi,
        enhance: (match) => `[Question Context] The user is asking for information about: ${match[0]}`
      },
      // Action requests
      {
        pattern: /\b(create|make|build|implement|add|update|delete|remove)\b/gi,
        enhance: (match) => `[Action Context] The user wants to perform an action: ${match[0]}`
      },
      // Error-related context
      {
        pattern: /\b(error|bug|issue|problem|fail|crash)\b/gi,
        enhance: (match) => `[Error Context] The user is experiencing issues: ${match[0]}`
      }
    ];
  }

  enhanceContext(message: Message): string {
    thoughtLogger.log('execution', 'Enhancing message context');

    try {
      let enhancedContext = '';
      const content = message.content;

      // Apply each rule and collect enhancements
      this.rules.forEach(rule => {
        const matches = content.match(rule.pattern);
        if (matches) {
          matches.forEach(match => {
            const enhancement = rule.enhance([match], message);
            enhancedContext += enhancement + '\n';
          });
        }
      });

      // Add role-specific context
      enhancedContext += this.getRoleContext(message);

      // Add temporal context
      enhancedContext += this.getTemporalContext(message);

      thoughtLogger.log('success', 'Context enhanced successfully');
      return enhancedContext;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to enhance context', { error });
      return '';
    }
  }

  private getRoleContext(message: Message): string {
    switch (message.role) {
      case 'user':
        return '[Role Context] This is a direct user query or request\n';
      case 'assistant':
        return '[Role Context] This is an AI assistant response\n';
      case 'system':
        return '[Role Context] This is a system message or instruction\n';
      default:
        return '';
    }
  }

  private getTemporalContext(message: Message): string {
    const now = Date.now();
    const messageAge = now - message.timestamp;
    
    if (messageAge < 60000) { // Less than 1 minute
      return '[Temporal Context] This is a very recent message\n';
    } else if (messageAge < 3600000) { // Less than 1 hour
      return '[Temporal Context] This message is from within the last hour\n';
    } else {
      return '[Temporal Context] This is an older message\n';
    }
  }

  addRule(rule: EnhancementRule): void {
    this.rules.push(rule);
  }

  clearRules(): void {
    this.rules = [];
    this.initializeRules();
  }
}