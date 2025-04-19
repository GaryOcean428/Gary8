import { DBConfig } from './db-config';
import { thoughtLogger } from '../logging/thought-logger';

export class DBInitializer {
  private static instance: DBInitializer;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  private constructor() {}

  static getInstance(): DBInitializer {
    if (!DBInitializer.instance) {
      DBInitializer.instance = new DBInitializer();
    }
    return DBInitializer.instance;
  }

  async initDatabase(): Promise<IDBDatabase> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((_resolve, _reject) => {
      const openRequest = indexedDB.open(DBConfig.DB_NAME, DBConfig.DB_VERSION);

      openRequest.onerror = () => {
        thoughtLogger.log('error', 'Failed to open database', { error: openRequest.error });
        _reject(openRequest.error);
      };

      openRequest.onsuccess = () => {
        this.db = openRequest.result;
        thoughtLogger.log('success', 'Database opened successfully');
        _resolve(this.db);
      };

      openRequest.onupgradeneeded = (_event) => {
        thoughtLogger.log('execution', 'Database upgrade needed, creating stores');
        const db = openRequest.result;
        this.createObjectStores(db);
      };
    });

    return this.initPromise;
  }

  private createObjectStores(_db: IDBDatabase): void {
    // Messages store
    if (!_db.objectStoreNames.contains(DBConfig.STORES.MESSAGES)) {
      const messagesStore = _db.createObjectStore(DBConfig.STORES.MESSAGES, { keyPath: 'id' });
      messagesStore.createIndex('chatId', 'chatId');
      messagesStore.createIndex('timestamp', 'timestamp');
      thoughtLogger.log('success', 'Created messages store');
    }

    // Memory store
    if (!_db.objectStoreNames.contains(DBConfig.STORES.MEMORY)) {
      const memoryStore = _db.createObjectStore(DBConfig.STORES.MEMORY, { keyPath: 'id' });
      memoryStore.createIndex('timestamp', 'timestamp');
      memoryStore.createIndex('type', 'type');
      thoughtLogger.log('success', 'Created memory store');
    }

    // User store
    if (!_db.objectStoreNames.contains(DBConfig.STORES.USER)) {
      _db.createObjectStore(DBConfig.STORES.USER, { keyPath: 'id' });
      thoughtLogger.log('success', 'Created user store');
    }

    // Settings store
    if (!_db.objectStoreNames.contains(DBConfig.STORES.SETTINGS)) {
      _db.createObjectStore(DBConfig.STORES.SETTINGS, { keyPath: 'id' });
      thoughtLogger.log('success', 'Created settings store');
    }

    // Chats store
    if (!_db.objectStoreNames.contains(DBConfig.STORES.CHATS)) {
      const chatsStore = _db.createObjectStore(DBConfig.STORES.CHATS, { keyPath: 'id' });
      chatsStore.createIndex('timestamp', 'timestamp');
      chatsStore.createIndex('title', 'title');
      thoughtLogger.log('success', 'Created chats store');
    }

    // Workflows store
    if (!_db.objectStoreNames.contains(DBConfig.STORES.WORKFLOWS)) {
      const workflowsStore = _db.createObjectStore(DBConfig.STORES.WORKFLOWS, { keyPath: 'id' });
      workflowsStore.createIndex('timestamp', 'timestamp');
      workflowsStore.createIndex('name', 'name');
      thoughtLogger.log('success', 'Created workflows store');
    }
  }

  async getDatabase(): Promise<IDBDatabase> {
    if (!this.db) {
      this.db = await this.initDatabase();
    }
    return this.db;
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
      thoughtLogger.log('success', 'Database connection closed');
    }
  }
}

export const dbInitializer = DBInitializer.getInstance();