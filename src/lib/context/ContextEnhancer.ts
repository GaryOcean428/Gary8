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
        enhance: (_match, _message) => {
          const code = _match[0].replace(/```(\w+)?\n?/, '').replace(/```$/, '');
          return `[Code Block] Language context: The user is working with code. Previous code snippet:\n${code}`;
        }
      },
      // Technical terms
      {
        pattern: /\b(api|function|component|database|server|client|endpoint)\b/gi,
        enhance: (_match, _message) => `[Technical Context] The conversation involves technical concepts, specifically: ${_match[0]}`
      },
      // Questions and inquiries
      {
        pattern: /\b(how|what|why|when|where|who|can you|could you)\b.*\?/gi,
        enhance: (_match, _message) => `[Question Context] The user is asking for information about: ${_match[0]}`
      },
      // Action requests
      {
        pattern: /\b(create|make|build|implement|add|update|delete|remove)\b/gi,
        enhance: (_match, _message) => `[Action Context] The user wants to perform an action: ${_match[0]}`
      },
      // Error-related context
      {
        pattern: /\b(error|bug|issue|problem|fail|crash)\b/gi,
        enhance: (_match, _message) => `[Error Context] The user is experiencing issues: ${_match[0]}`
      }
    ];
  }

  enhanceContext(_message: Message): string {
    thoughtLogger.log('execution', 'Enhancing message context');

    try {
      let enhancedContext = '';
      const content = _message.content;

      // Apply each rule and collect enhancements
      this.rules.forEach(_rule => {
        const matches = content.match(_rule.pattern);
        if (matches) {
          matches.forEach(_match => {
            const enhancement = _rule.enhance([_match], _message);
            enhancedContext += enhancement + '\n';
          });
        }
      });

      // Add role-specific context
      enhancedContext += this.getRoleContext(_message);

      // Add temporal context
      enhancedContext += this.getTemporalContext(_message);

      thoughtLogger.log('success', 'Context enhanced successfully');
      return enhancedContext;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to enhance context', { error });
      return '';
    }
  }

  private getRoleContext(_message: Message): string {
    switch (_message.role) {
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

  private getTemporalContext(_message: Message): string {
    const now = Date.now();
    const messageAge = now - _message.timestamp;
    
    if (messageAge < 60000) { // Less than 1 minute
      return '[Temporal Context] This is a very recent message\n';
    } else if (messageAge < 3600000) { // Less than 1 hour
      return '[Temporal Context] This message is from within the last hour\n';
    } else {
      return '[Temporal Context] This is an older message\n';
    }
  }

  addRule(_rule: EnhancementRule): void {
    this.rules.push(_rule);
  }

  clearRules(): void {
    this.rules = [];
    this.initializeRules();
  }
}
