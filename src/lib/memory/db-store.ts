import { openDB, type IDBPDatabase } from 'idb';
import type { Message } from '../types';

export class DBStore {
  private db: IDBPDatabase | null = null;
  private dbName = 'agent-one-db';
  private version = 1;

  async initialize(): Promise<void> {
    if (this.db) return;

    this.db = await openDB(this.dbName, this.version, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('messages')) {
          db.createObjectStore('messages', { keyPath: 'id' });
        }
      },
    });
  }

  async addMessage(message: Message): Promise<void> {
    if (!this.db) await this.initialize();
    await this.db!.add('messages', message);
  }

  async getMessages(): Promise<Message[]> {
    if (!this.db) await this.initialize();
    return this.db!.getAll('messages');
  }

  async clearMessages(): Promise<void> {
    if (!this.db) await this.initialize();
    await this.db!.clear('messages');
  }
}