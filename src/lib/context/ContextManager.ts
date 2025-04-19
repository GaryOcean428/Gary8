import { thoughtLogger } from '../logging/thought-logger';
import { VectorMemory } from '../memory/vector-memory';
import { Message } from '../types';

interface ContextWindow {
  messages: Message[];
  metadata: Record<string, unknown>;
  timestamp: number;
}

export class ContextManager {
  private static instance: ContextManager;
  private vectorMemory: VectorMemory;
  private contextWindows: Map<string, ContextWindow> = new Map();
  private readonly maxWindowSize = 10;

  private constructor() {
    this.vectorMemory = new VectorMemory();
  }

  static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
    }
    return ContextManager.instance;
  }

  async getContext(_message: Message): Promise<string> {
    thoughtLogger.log('execution', 'Retrieving context for message');

    try {
      // Get relevant memories
      const memories = await this.vectorMemory.recall(_message.content);
      
      // Get recent conversation context
      const recentContext = this.getRecentContext(_message);

      // Combine and format context
      const context = [
        ...memories.map(_m => `[Memory] ${_m.content}`),
        ...recentContext.map(_m => `[Recent] ${_m.role}: ${_m.content}`)
      ].join('\n\n');

      thoughtLogger.log('success', 'Context retrieved successfully', {
        memoriesFound: memories.length,
        recentContextSize: recentContext.length
      });

      return context;
    } catch (error) {
      thoughtLogger.log('error', 'Failed to retrieve context', { error });
      throw error;
    }
  }

  async updateContext(_windowId: string, _message: Message, _metadata?: Record<string, unknown>): Promise<void> {
    const window = this.contextWindows.get(_windowId) || {
      messages: [],
      metadata: {},
      timestamp: Date.now()
    };

    // Add message to window
    window.messages.push(_message);
    
    // Update metadata
    if (_metadata) {
      window.metadata = { ...window.metadata, ..._metadata };
    }

    // Trim window if needed
    if (window.messages.length > this.maxWindowSize) {
      window.messages = window.messages.slice(-this.maxWindowSize);
    }

    this.contextWindows.set(_windowId, window);

    // Store in vector memory for long-term recall
    await this.vectorMemory.store(_message.content, 'message');
  }

  private getRecentContext(_message: Message): Message[] {
    // Find most relevant context window
    let relevantWindow: ContextWindow | undefined;
    let highestSimilarity = -1;

    for (const window of this.contextWindows.values()) {
      const similarity = this.calculateContextSimilarity(_message, window);
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        relevantWindow = window;
      }
    }

    return relevantWindow?.messages || [];
  }

  private calculateContextSimilarity(_message: Message, _window: ContextWindow): number {
    // Simple keyword-based similarity for demonstration
    // In production, use proper embedding similarity
    const messageWords = new Set(_message.content.toLowerCase().split(/\s+/));
    const windowWords = new Set(
      _window.messages
        .map(_m => _m.content.toLowerCase())
        .join(' ')
        .split(/\s+/)
    );

    const intersection = new Set(
      Array.from(messageWords).filter(_word => windowWords.has(_word))
    );

    return intersection.size / Math.max(messageWords.size, windowWords.size);
  }

  clearContext(_windowId: string): void {
    this.contextWindows.delete(_windowId);
  }

  getContextWindowCount(): number {
    return this.contextWindows.size;
  }
}