import { VectorStore } from './vector-store';
import { IndexedDBStorage } from '../storage/indexed-db';
import { thoughtLogger } from '../logging/thought-logger';
import type { Message } from '../types';

export class MemoryManager {
  private static instance: MemoryManager;
  private vectorStore: VectorStore;
  private storage: IndexedDBStorage;
  private initialized = false;

  private constructor() {
    this.vectorStore = new VectorStore();
    this.storage = new IndexedDBStorage();
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.storage.init();
      await this.vectorStore.initialize();
      this.initialized = true;
      thoughtLogger.log('success', 'Memory manager initialized');
    } catch (error) {
      thoughtLogger.log('error', 'Failed to initialize memory manager', { error });
      throw error;
    }
  }

  async storeMessage(message: Message): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Store in vector memory for semantic search
      const vectorId = await this.vectorStore.addDocument(message.content);

      // Store full message in IndexedDB
      await this.storage.put('messages', {
        ...message,
        vectorId,
        timestamp: Date.now()
      });

      thoughtLogger.log('success', 'Message stored successfully', {
        messageId: message.id,
        vectorId
      });
    } catch (error) {
      thoughtLogger.log('error', 'Failed to store message', { error });
      throw error;
    }
  }

  async getRelevantContext(query: string, limit = 5): Promise<Message[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Search vector store for similar content
      const results = await this.vectorStore.search(query, limit);

      // Fetch full messages from IndexedDB
      const messages = await Promise.all(
        results.map(async result => {
          const message = await this.storage.get('messages', result.id);
          return message;
        })
      );

      return messages.filter(Boolean);
    } catch (error) {
      thoughtLogger.log('error', 'Failed to get relevant context', { error });
      throw error;
    }
  }

  async clearMemory(): Promise<void> {
    try {
      await Promise.all([
        this.storage.clear('messages'),
        this.vectorStore.clear()
      ]);
      thoughtLogger.log('success', 'Memory cleared successfully');
    } catch (error) {
      thoughtLogger.log('error', 'Failed to clear memory', { error });
      throw error;
    }
  }

  get isInitialized(): boolean {
    return this.initialized;
  }
}