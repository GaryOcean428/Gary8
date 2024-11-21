import { Message } from '../types';
import { IndexedDBStorage } from './indexed-db';
import { thoughtLogger } from '../logging/thought-logger';

interface SavedChat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

interface SavedWorkflow {
  id: string;
  title: string;
  trigger?: {
    type: 'schedule' | 'event';
    config: Record<string, any>;
  };
  steps: Array<{
    type: string;
    config: Record<string, any>;
  }>;
  createdAt: number;
  updatedAt: number;
  lastRun?: number;
}

interface Settings {
  id: string;
  category: string;
  values: Record<string, any>;
  updatedAt: number;
}

export class PersistenceManager {
  private static instance: PersistenceManager;
  private storage: IndexedDBStorage;
  private initialized: boolean = false;

  private constructor() {
    this.storage = new IndexedDBStorage();
  }

  static getInstance(): PersistenceManager {
    if (!PersistenceManager.instance) {
      PersistenceManager.instance = new PersistenceManager();
    }
    return PersistenceManager.instance;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await this.storage.init();
      this.initialized = true;
      thoughtLogger.log('success', 'PersistenceManager initialized successfully');
    } catch (error) {
      thoughtLogger.log('error', 'Failed to initialize PersistenceManager', { error });
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  // Chat Management
  async saveChat(title: string, messages: Message[], tags?: string[]): Promise<string> {
    await this.ensureInitialized();
    
    const id = crypto.randomUUID();
    const chat: SavedChat = {
      id,
      title,
      messages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags
    };

    await this.storage.put('chats', chat);
    thoughtLogger.log('success', 'Chat saved successfully', { chatId: id });
    return id;
  }

  async getChat(id: string): Promise<SavedChat | null> {
    await this.ensureInitialized();
    return this.storage.get('chats', id);
  }

  async listChats(): Promise<SavedChat[]> {
    await this.ensureInitialized();
    try {
      const chats = await this.storage.getAll('chats');
      return chats.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      thoughtLogger.log('error', 'Failed to list chats', { error });
      return [];
    }
  }

  async deleteChat(id: string): Promise<void> {
    await this.ensureInitialized();
    await this.storage.delete('chats', id);
    thoughtLogger.log('success', 'Chat deleted', { chatId: id });
  }

  // Workflow Management
  async saveWorkflow(workflow: Omit<SavedWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    await this.ensureInitialized();
    
    const id = crypto.randomUUID();
    const fullWorkflow: SavedWorkflow = {
      ...workflow,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await this.storage.put('workflows', fullWorkflow);
    thoughtLogger.log('success', 'Workflow saved', { workflowId: id });
    return id;
  }

  async getWorkflow(id: string): Promise<SavedWorkflow | null> {
    await this.ensureInitialized();
    return this.storage.get('workflows', id);
  }

  async listWorkflows(): Promise<SavedWorkflow[]> {
    await this.ensureInitialized();
    try {
      const workflows = await this.storage.getAll('workflows');
      return workflows.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      thoughtLogger.log('error', 'Failed to list workflows', { error });
      return [];
    }
  }

  async deleteWorkflow(id: string): Promise<void> {
    await this.ensureInitialized();
    await this.storage.delete('workflows', id);
    thoughtLogger.log('success', 'Workflow deleted', { workflowId: id });
  }

  async updateWorkflowLastRun(id: string): Promise<void> {
    await this.ensureInitialized();
    const workflow = await this.getWorkflow(id);
    if (workflow) {
      workflow.lastRun = Date.now();
      workflow.updatedAt = Date.now();
      await this.storage.put('workflows', workflow);
    }
  }

  // Settings Management
  async saveSettings(category: string, values: Record<string, any>): Promise<void> {
    await this.ensureInitialized();
    const settings: Settings = {
      id: category,
      category,
      values,
      updatedAt: Date.now()
    };

    await this.storage.put('settings', settings);
    thoughtLogger.log('success', 'Settings saved', { category });
  }

  async getSettings(category: string): Promise<Record<string, any> | null> {
    await this.ensureInitialized();
    const settings = await this.storage.get('settings', category);
    return settings?.values || null;
  }

  async getAllSettings(): Promise<Record<string, Record<string, any>>> {
    await this.ensureInitialized();
    try {
      const settings = await this.storage.getAll('settings');
      return settings.reduce((acc, setting) => {
        acc[setting.category] = setting.values;
        return acc;
      }, {} as Record<string, Record<string, any>>);
    } catch (error) {
      thoughtLogger.log('error', 'Failed to get all settings', { error });
      return {};
    }
  }
}