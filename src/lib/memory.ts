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
      upgrade(_db) {
        // Create stores if they don't exist
        if (!_db.objectStoreNames.contains('long-term')) {
          _db.createObjectStore('long-term', { keyPath: 'id' });
        }
        if (!_db.objectStoreNames.contains('user-info')) {
          _db.createObjectStore('user-info', { keyPath: 'key' });
        }
      },
    });

    this.dbInitialized = true;
  }

  async store(_message: Message, _response: Message) {
    // Add to short-term memory
    this.shortTermMemory.push(_message);
    this.shortTermMemory.push(_response);

    if (this.shortTermMemory.length > this.maxShortTermSize) {
      this.shortTermMemory.shift();
    }

    // Check for user information to store long-term
    if (_message.role === 'user') {
      const content = _message.content.toLowerCase();
      if (content.includes('my name is') || content.includes('i am called')) {
        const name = this.extractName(content);
        if (name) {
          await this.storeUserInfo('name', name);
        }
      }
    }
  }

  private extractName(_content: string): string | null {
    const namePatterns = [
      /my name is (\w+)/i,
      /i am called (\w+)/i,
      /i'm (\w+)/i,
      /call me (\w+)/i
    ];

    for (const pattern of namePatterns) {
      const match = _content.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  async storeUserInfo(_key: string, _value: string) {
    await this.initDB();
    if (!this.db) return;

    try {
      const tx = this.db.transaction('user-info', 'readwrite');
      const store = tx.objectStore('user-info');
      await store.put({
        _key,
        _value,
        timestamp: Date.now()
      });
      await tx.done;
    } catch (error) {
      console.error('Error storing user info:', error);
    }
  }

  async getUserInfo(_key: string): Promise<string | null> {
    await this.initDB();
    if (!this.db) return null;

    try {
      const info = await this.db.get('user-info', _key);
      return info?.value || null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  async getRelevantMemories(_content: string): Promise<string> {
    await this.initDB();
    
    // Get user info
    const userName = await this.getUserInfo('name');
    const userContext = userName ? `User's name is ${userName}.` : '';

    // Get recent messages for context
    const recentMessages = this.shortTermMemory
      .slice(-5)
      .map(_msg => `${_msg.role}: ${_msg.content}`)
      .join('\n');

    // Combine all context
    return [userContext, recentMessages]
      .filter(Boolean)
      .join('\n\n');
  }

  getRecentMessages(_count = 10): Message[] {
    return this.shortTermMemory.slice(-_count);
  }

  clearShortTermMemory() {
    this.shortTermMemory = [];
  }
}

export const memory = new Memory();