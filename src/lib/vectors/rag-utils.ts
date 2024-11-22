import { HybridVectorStore } from './hybrid-store';
import { thoughtLogger } from '../utils/logger';

export class RAGUtils {
  constructor(private vectorStore: HybridVectorStore) {}

  async generateContext(query: string, options = {
    maxTokens: 2000,
    minRelevance: 0.7,
    maxResults: 5
  }): Promise<string> {
    try {
      const results = await this.vectorStore.search(query, {
        limit: options.maxResults,
        minScore: options.minRelevance,
        includeLocal: true,
        includePermanent: true
      });

      // Format results into context
      return results.map(r => {
        const source = r.metadata.filename ? 
          `[Source: ${r.metadata.filename}]` : 
          '[Internal Memory]';
        return `${source}\n${r.content}\n`;
      }).join('\n---\n');
    } catch (error) {
      thoughtLogger.log('error', 'Failed to generate context', { error });
      return '';
    }
  }

  async enhancePrompt(basePrompt: string, query: string): Promise<string> {
    const context = await this.generateContext(query);
    return context ? 
      `Context:\n${context}\n\nQuery: ${query}\n\n${basePrompt}` :
      `Query: ${query}\n\n${basePrompt}`;
  }
} 