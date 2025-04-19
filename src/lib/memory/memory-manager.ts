import { Message } from '../../types';
import { VectorStore } from './vector-store';

export class MemoryManager {
  private vectorStore: VectorStore;

  constructor() {
    this.vectorStore = new VectorStore();
  }

  async storeConversation(_messages: Message[]): Promise<void> {
    for (const message of _messages) {
      // Simple encoding for demo - in production use proper embedding model
      const vector = this.textToVector(message.content);
      await this.vectorStore.addItem(message.id, vector, message);
    }
  }

  async searchSimilarMessages(_query: string, _limit: number = 5): Promise<Message[]> {
    const queryVector = this.textToVector(_query);
    return this.vectorStore.search(queryVector, _limit);
  }

  async clearConversation(): Promise<void> {
    await this.vectorStore.clear();
  }

  // Simple text encoding for demo purposes
  // In production, use a proper embedding model
  private textToVector(_text: string): number[] {
    const vector: number[] = new Array(128).fill(0);
    const normalized = _text.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    for (let i = 0; i < normalized.length && i < vector.length; i++) {
      vector[i] = normalized.charCodeAt(i) / 255; // Normalize to 0-1 range
    }
    
    return vector;
  }
}