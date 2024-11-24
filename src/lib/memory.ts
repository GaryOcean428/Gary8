import type { Message } from '../types';
import { openDB, type IDBPDatabase } from 'idb';

interface UserInfo {
  key: string;
  value: string;
  timestamp: number;
}

interface LongTermMemory {
  id: string;
  content: string;
  type: string;
  timestamp: number;
}

export class Memory {
  private shortTermMemory: Message[] = [];
  private maxShortTermSize = 100;
  private db: IDBPDatabase | null = null;
  private dbInitialized = false;

  constructor() {
    this.initDB().catch(console.error);
  }

  private async initDB() {
    if (this.dbInitialized) return;

    this.db = await openDB<{
      'long-term': LongTermMemory;
      'user-info': UserInfo;
    }>('agent-memory', 1, {
      upgrade(db) {
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('long-term')) {
          db.createObjectStore('long-term', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('user-info')) {
          db.createObjectStore('user-info', { keyPath: 'key' });
        }
      },
    });

    this.dbInitialized = true;
  }

  async store(message: Message, response: Message) {
    // Add to short-term memory
    this.shortTermMemory.push(message);
    this.shortTermMemory.push(response);

    if (this.shortTermMemory.length > this.maxShortTermSize) {
      this.shortTermMemory.shift();
    }

    // Check for user information to store long-term
    if (message.role === 'user') {
      const content = message.content.toLowerCase();
      if (content.includes('my name is') || content.includes('i am called')) {
        const name = this.extractName(content);
        if (name) {
          await this.storeUserInfo('name', name);
        }
      }
    }
  }

  private extractName(content: string): string | null {
    const namePatterns = [
      /my name is (\w+)/i,
      /i am called (\w+)/i,
      /i'm (\w+)/i,
      /call me (\w+)/i
    ];

    for (const pattern of namePatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  async storeUserInfo(key: string, value: string) {
    await this.initDB();
    if (!this.db) return;

    try {
      const tx = this.db.transaction('user-info', 'readwrite');
      const store = tx.objectStore('user-info');
      await store.put({
        key,
        value,
        timestamp: Date.now()
      });
      await tx.done;
    } catch (error) {
      console.error('Error storing user info:', error);
    }
  }

  async getUserInfo(key: string): Promise<string | null> {
    await this.initDB();
    if (!this.db) return null;

    try {
      const info = await this.db.get('user-info', key);
      return info?.value || null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  async getRelevantMemories(content: string): Promise<string> {
    await this.initDB();
    
    // Get user info
    const userName = await this.getUserInfo('name');
    const userContext = userName ? `User's name is ${userName}.` : '';

    // Get recent messages for context
    const recentMessages = this.shortTermMemory
      .slice(-5)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    // Combine all context
    return [userContext, recentMessages]
      .filter(Boolean)
      .join('\n\n');
  }

  getRecentMessages(count = 10): Message[] {
    return this.shortTermMemory.slice(-count);
  }

  clearShortTermMemory() {
    this.shortTermMemory = [];
  }
}

export const memory = new Memory();