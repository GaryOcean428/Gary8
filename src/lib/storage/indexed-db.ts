import { thoughtLogger } from '../logging/thought-logger';
import { AppError } from '../errors/AppError';

export class IndexedDBStorage {
  private db: IDBDatabase | null = null;
  private initialized = false;
  private dbName = 'agent-one-db';
  private version = 1;

  private readonly stores = {
    documents: 'documents',
    workspaces: 'workspaces',
    chats: 'chats',
    messages: 'messages',
    settings: 'settings',
    memory: 'memory'
  };

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      this.db = await this.openDatabase();
      this.initialized = true;
      thoughtLogger.log('success', 'IndexedDB initialized successfully');
    } catch (error) {
      thoughtLogger.log('error', 'Failed to initialize IndexedDB', { error });
      throw new AppError('Failed to initialize storage', 'STORAGE_ERROR', error);
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new AppError('Failed to open database', 'STORAGE_ERROR', request.error));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;

        // Create all required object stores if they don't exist
        Object.entries(this.stores).forEach(([key, name]) => {
          if (!db.objectStoreNames.contains(name)) {
            const store = db.createObjectStore(name, { keyPath: 'id' });

            // Add indexes based on store type
            switch (name) {
              case 'messages':
                store.createIndex('chatId', 'chatId', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                break;
              case 'chats':
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('title', 'title', { unique: false });
                break;
              case 'documents':
                store.createIndex('workspaceId', 'workspaceId', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                break;
            }
          }
        });

        thoughtLogger.log('success', 'Database schema updated');
      };
    });
  }

  async put(storeName: string, value: any): Promise<void> {
    if (!this.db) {
      throw new AppError('Database not initialized', 'STORAGE_ERROR');
    }

    if (!this.stores[storeName as keyof typeof this.stores]) {
      throw new AppError(`Invalid store name: ${storeName}`, 'STORAGE_ERROR');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onerror = () => {
        reject(new AppError('Failed to store data', 'STORAGE_ERROR', request.error));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async get(storeName: string, key: IDBValidKey): Promise<any> {
    if (!this.db) {
      throw new AppError('Database not initialized', 'STORAGE_ERROR');
    }

    if (!this.stores[storeName as keyof typeof this.stores]) {
      throw new AppError(`Invalid store name: ${storeName}`, 'STORAGE_ERROR');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => {
        reject(new AppError('Failed to retrieve data', 'STORAGE_ERROR', request.error));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  async getAll(storeName: string): Promise<any[]> {
    if (!this.db) {
      throw new AppError('Database not initialized', 'STORAGE_ERROR');
    }

    if (!this.stores[storeName as keyof typeof this.stores]) {
      throw new AppError(`Invalid store name: ${storeName}`, 'STORAGE_ERROR');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => {
        reject(new AppError('Failed to retrieve data', 'STORAGE_ERROR', request.error));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    if (!this.db) {
      throw new AppError('Database not initialized', 'STORAGE_ERROR');
    }

    if (!this.stores[storeName as keyof typeof this.stores]) {
      throw new AppError(`Invalid store name: ${storeName}`, 'STORAGE_ERROR');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => {
        reject(new AppError('Failed to delete data', 'STORAGE_ERROR', request.error));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) {
      throw new AppError('Database not initialized', 'STORAGE_ERROR');
    }

    if (!this.stores[storeName as keyof typeof this.stores]) {
      throw new AppError(`Invalid store name: ${storeName}`, 'STORAGE_ERROR');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => {
        reject(new AppError('Failed to clear store', 'STORAGE_ERROR', request.error));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }
}