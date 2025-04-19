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

  async processMessage(_message: Message, _onStream?: (content: string) => void): Promise<Message> {
    try {
      const context = await this.memory.getRelevantMemories(_message.content);
      
      // Determine if reasoning is needed
      const complexity = this.assessComplexity(_message.content);
      const strategy = this.reasoningEngine.selectStrategy(_message.content, complexity);
      
      // Get reasoning steps if needed
      let reasoningSteps: ReasoningStep[] = [];
      if (strategy !== 'none') {
        reasoningSteps = await this.reasoningEngine.reason(_message.content, strategy);
      }

      // Include reasoning in the prompt if available
      const reasoningContext = reasoningSteps.length > 0
        ? '\n\nReasoning steps:\n' + reasoningSteps.map(_step => 
            `[${_step.type.toUpperCase()}] ${_step.content}`
          ).join('\n')
        : '';

      const response = await this.callAPI(
        _message,
        context + reasoningContext,
        _onStream
      );

      await this.memory.store(_message, response);
      return response;
    } catch (error) {
      console.error('Agent processing error:', error);
      throw error;
    }
  }

  private assessComplexity(_content: string): number {
    const factors = {
      length: Math.min(_content.length / 500, 1),
      questionWords: (_content.match(/\b(how|why|what|when|where|who)\b/gi) || []).length * 0.1,
      technicalTerms: (_content.match(/\b(algorithm|function|process|system|analyze)\b/gi) || []).length * 0.15,
      codeRelated: /\b(code|program|debug|function|api)\b/i.test(_content) ? 0.3 : 0,
      multipleSteps: (_content.match(/\b(and|then|after|before|finally)\b/gi) || []).length * 0.1
    };

    return Math.min(
      Object.values(factors).reduce((_sum, _value) => _sum + _value, 0),
      1
    );
  }

  private async callAPI(_message: Message, _context: string, _onStream?: (content: string) => void): Promise<Message> {
    const response = await fetch(`${config.apiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: `${config.systemPrompt}\n\nContext: ${_context}` },
          { role: 'user', content: _message.content }
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        stream: Boolean(_onStream)
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    if (_onStream && response.body) {
      const reader = response.body.getReader();
      const processor = new StreamProcessor(_onStream);
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