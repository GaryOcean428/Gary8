import { PineconeClient } from '../clients/pinecone-client';
import { DeepSeekClient } from '../clients/deepseek-client';
import { thoughtLogger } from '../utils/logger';
import { MonitoringService } from '../monitoring/monitoring-service';

interface RAGContext {
  query: string;
  type: 'code' | 'documentation' | 'error' | 'test';
  filters?: Record<string, any>;
  limit?: number;
}

interface RAGResult {
  content: string;
  context: {
    sources: string[];
    relevance: number;
    usage: {
      tokens: number;
      cost: number;
    };
  };
}

export class RAGPipeline {
  private static instance: RAGPipeline;
  private pinecone: PineconeClient;
  private deepseek: DeepSeekClient;
  private monitoring: MonitoringService;

  private constructor() {
    this.pinecone = PineconeClient.getInstance();
    this.deepseek = DeepSeekClient.getInstance();
    this.monitoring = MonitoringService.getInstance();
  }

  static getInstance(): RAGPipeline {
    if (!this.instance) {
      this.instance = new RAGPipeline();
    }
    return this.instance;
  }

  async process(context: RAGContext): Promise<RAGResult> {
    return await this.monitoring.trackOperation('rag_pipeline', async () => {
      // 1. Retrieve relevant context
      const relevantDocs = await this.retrieveContext(context);

      // 2. Augment the query with context
      const augmentedQuery = await this.augmentQuery(context.query, relevantDocs);

      // 3. Generate response
      const response = await this.generateResponse(augmentedQuery, context.type);

      // 4. Store interaction for future context
      await this.storeInteraction(context, response);

      return {
        content: response,
        context: {
          sources: relevantDocs.map(doc => doc.id),
          relevance: this.calculateRelevance(relevantDocs),
          usage: await this.calculateUsage(context, response)
        }
      };
    });
  }

  private async retrieveContext(context: RAGContext): Promise<any[]> {
    const queryEmbedding = await this.pinecone.getEmbedding(context.query);
    
    return await this.pinecone.query(queryEmbedding, {
      filter: {
        type: context.type,
        ...context.filters
      },
      topK: context.limit || 5
    });
  }

  private async augmentQuery(query: string, context: any[]): Promise<string> {
    const contextStr = context
      .map(doc => `${doc.content}\nSource: ${doc.metadata.source}`)
      .join('\n\n');

    return `Given the following context and query, provide a detailed response:

Context:
${contextStr}

Query:
${query}

Response should:
1. Incorporate relevant information from the context
2. Cite sources where appropriate
3. Be well-structured and clear
4. Include code examples if relevant`;
  }

  private async generateResponse(query: string, type: string): Promise<string> {
    const prompt = this.formatPromptForType(query, type);
    return await this.deepseek.generateCode(prompt);
  }

  private formatPromptForType(query: string, type: string): string {
    switch (type) {
      case 'code':
        return `Generate code that addresses: ${query}`;
      case 'documentation':
        return `Generate documentation for: ${query}`;
      case 'error':
        return `Provide error analysis and solution for: ${query}`;
      case 'test':
        return `Generate test cases for: ${query}`;
      default:
        return query;
    }
  }

  private async storeInteraction(
    context: RAGContext,
    response: string
  ): Promise<void> {
    await this.pinecone.upsert({
      text: response,
      metadata: {
        type: context.type,
        query: context.query,
        timestamp: Date.now()
      }
    });
  }

  private calculateRelevance(docs: any[]): number {
    return docs.reduce((acc, doc) => acc + (doc.score || 0), 0) / docs.length;
  }

  private async calculateUsage(
    context: RAGContext,
    response: string
  ): Promise<{ tokens: number; cost: number }> {
    // Implement token counting and cost calculation
    return {
      tokens: 0,
      cost: 0
    };
  }
} 