import { APIClient } from './api/api-client';
import { thoughtLogger } from './logging/thought-logger';
import { AppError } from './errors/AppError';
import type { Message } from './types';

class AgentSystem {
  private apiClient: APIClient;
  private initialized = false;

  constructor() {
    this.apiClient = APIClient.getInstance();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.apiClient.initialize();
      this.initialized = true;
      thoughtLogger.log('success', 'Agent system initialized successfully');
    } catch (error) {
      thoughtLogger.log('error', 'Failed to initialize agent system', { error });
      throw error;
    }
  }

  async processMessage(
    content: string,
    onProgress?: (content: string) => void
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const message: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now()
      };

      await this.apiClient.chat([message], onProgress);
      thoughtLogger.log('success', 'Message processed successfully');
    } catch (error) {
      thoughtLogger.log('error', 'Message processing failed', { error });
      throw error instanceof AppError ? error : new AppError('Failed to process message', 'PROCESSING_ERROR');
    }
  }
}

export const agentSystem = new AgentSystem();