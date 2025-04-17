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

  async getContext(message: Message): Promise<string> {
    thoughtLogger.log('execution', 'Retrieving context for message');

    try {
      // Get relevant memories
      const memories = await this.vectorMemory.recall(message.content);
      
      // Get recent conversation context
      const recentContext = this.getRecentContext(message);

      // Combine and format context
      const context = [
        ...memories.map(m => `[Memory] ${m.content}`),
        ...recentContext.map(m => `[Recent] ${m.role}: ${m.content}`)
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

  async updateContext(windowId: string, message: Message, metadata?: Record<string, unknown>): Promise<void> {
    const window = this.contextWindows.get(windowId) || {
      messages: [],
      metadata: {},
      timestamp: Date.now()
    };

    // Add message to window
    window.messages.push(message);
    
    // Update metadata
    if (metadata) {
      window.metadata = { ...window.metadata, ...metadata };
    }

    // Trim window if needed
    if (window.messages.length > this.maxWindowSize) {
      window.messages = window.messages.slice(-this.maxWindowSize);
    }

    this.contextWindows.set(windowId, window);

    // Store in vector memory for long-term recall
    await this.vectorMemory.store(message.content, 'message');
  }

  private getRecentContext(message: Message): Message[] {
    // Find most relevant context window
    let relevantWindow: ContextWindow | undefined;
    let highestSimilarity = -1;

    for (const window of this.contextWindows.values()) {
      const similarity = this.calculateContextSimilarity(message, window);
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        relevantWindow = window;
      }
    }

    return relevantWindow?.messages || [];
  }

  private calculateContextSimilarity(message: Message, window: ContextWindow): number {
    // Simple keyword-based similarity for demonstration
    // In production, use proper embedding similarity
    const messageWords = new Set(message.content.toLowerCase().split(/\s+/));
    const windowWords = new Set(
      window.messages
        .map(m => m.content.toLowerCase())
        .join(' ')
        .split(/\s+/)
    );

    const intersection = new Set(
      Array.from(messageWords).filter(word => windowWords.has(word))
    );

    return intersection.size / Math.max(messageWords.size, windowWords.size);
  }

  clearContext(windowId: string): void {
    this.contextWindows.delete(windowId);
  }

  getContextWindowCount(): number {
    return this.contextWindows.size;
  }
}