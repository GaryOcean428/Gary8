import { config } from './config';
import { Memory } from './memory';
import { StreamProcessor } from './streaming';
import { ReasoningEngine, type ReasoningStep } from './reasoning';
import type { Message } from '../types';

class AgentManager {
  private memory: Memory;
  private reasoningEngine: ReasoningEngine;

  constructor() {
    this.memory = new Memory();
    this.reasoningEngine = new ReasoningEngine();
  }

  async processMessage(message: Message, onStream?: (content: string) => void): Promise<Message> {
    try {
      const context = await this.memory.getRelevantMemories(message.content);
      
      // Determine if reasoning is needed
      const complexity = this.assessComplexity(message.content);
      const strategy = this.reasoningEngine.selectStrategy(message.content, complexity);
      
      // Get reasoning steps if needed
      let reasoningSteps: ReasoningStep[] = [];
      if (strategy !== 'none') {
        reasoningSteps = await this.reasoningEngine.reason(message.content, strategy);
      }

      // Include reasoning in the prompt if available
      const reasoningContext = reasoningSteps.length > 0
        ? '\n\nReasoning steps:\n' + reasoningSteps.map(step => 
            `[${step.type.toUpperCase()}] ${step.content}`
          ).join('\n')
        : '';

      const response = await this.callAPI(
        message,
        context + reasoningContext,
        onStream
      );

      await this.memory.store(message, response);
      return response;
    } catch (error) {
      console.error('Agent processing error:', error);
      throw error;
    }
  }

  private assessComplexity(content: string): number {
    const factors = {
      length: Math.min(content.length / 500, 1),
      questionWords: (content.match(/\b(how|why|what|when|where|who)\b/gi) || []).length * 0.1,
      technicalTerms: (content.match(/\b(algorithm|function|process|system|analyze)\b/gi) || []).length * 0.15,
      codeRelated: /\b(code|program|debug|function|api)\b/i.test(content) ? 0.3 : 0,
      multipleSteps: (content.match(/\b(and|then|after|before|finally)\b/gi) || []).length * 0.1
    };

    return Math.min(
      Object.values(factors).reduce((sum, value) => sum + value, 0),
      1
    );
  }

  private async callAPI(message: Message, context: string, onStream?: (content: string) => void): Promise<Message> {
    const response = await fetch(`${config.apiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: `${config.systemPrompt}\n\nContext: ${context}` },
          { role: 'user', content: message.content }
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        stream: Boolean(onStream)
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    if (onStream && response.body) {
      const reader = response.body.getReader();
      const processor = new StreamProcessor(onStream);
      await processor.processStream(reader);
      
      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      };
    }

    const data = await response.json();
    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: data.choices[0]?.message?.content || '',
      timestamp: Date.now()
    };
  }
}