import { Pinecone } from '@pinecone-database/pinecone';
import { thoughtLogger } from '../logging/thought-logger';
import { PineconeError } from '../errors/PineconeError';
import type { PineconeVector, PineconeQueryOptions } from '../../types';
import { error } from 'console';

export class PineconeClient {
  private static instance: PineconeClient;
  private client: Pinecone;
  private initialized: boolean = false;

  private constructor() {
    this.client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!
    });
  }

  static getInstance(): PineconeClient {
    if (!this.instance) {
      this.instance = new PineconeClient();
    }
    return this.instance;
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      this.initialized = true;
    }
  }

  private handleError(error: unknown, operation: string): never {
    thoughtLogger.error('Pinecone operation failed', {
      operation,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw PineconeError.fromError(error, operation);
  }

  async upsertVectors(namespace: string, vectors: PineconeVector[]) {
    try {
      await this.ensureInitialized();
      const index = this.client.index(process.env.PINECONE_INDEX!);
      return await index.upsert(vectors);
    } catch (error) {
      this.handleError(error, 'upsert');
    }
  }

  async queryVectors(namespace: string, options: PineconeQueryOptions) {
    try {
      await this.ensureInitialized();
      const index = this.client.index(process.env.PINECONE_INDEX!);
      return await index.query({
        ...options,
        topK: options.topK ?? 10
      });
    } catch (error) {
      this.handleError(error, 'query');
    }
  }

  async deleteVectors(namespace: string, ids: string[]) {
    try {
      await this.ensureInitialized();
          // Start of Selection
          const index = this.client.index(process.env.PINECONE_INDEX!) as any;
          return await index.deleteVectors({ ids });
      } catch (error) {
        this.handleError(error, 'delete');
      }
    }
    }

    // Export a singleton instance
    export const pineconeClient = PineconeClient.getInstance();
