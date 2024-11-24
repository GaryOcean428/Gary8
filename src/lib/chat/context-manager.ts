import { HybridVectorStore } from '../vectors/hybrid-store';
import { RAGUtils } from '../vectors/rag-utils';
import { SemanticClustering } from '../vectors/semantic-clustering';
import { DocumentProcessor } from '../utils/document-processor';
import { thoughtLogger } from '../utils/logger';

export class ChatContextManager {
  private ragUtils: RAGUtils;
  private clustering: SemanticClustering;
  private docProcessor: DocumentProcessor;

  constructor(private vectorStore: HybridVectorStore) {
    this.ragUtils = new RAGUtils(vectorStore);
    this.clustering = new SemanticClustering(vectorStore);
    this.docProcessor = new DocumentProcessor();
  }

  async enhanceMessage(message: string): Promise<{
    enhancedPrompt: string;
    context: {
      relevantDocs: any[];
      summary?: string;
      clusters?: any[];
    };
  }> {
    try {
      // Get relevant documents
      const relevantDocs = await this.vectorStore.search(message, {
        limit: 5,
        minScore: 0.7
      });

      // Generate context summary if we have relevant docs
      let summary;
      if (relevantDocs.length > 0) {
        const combinedContent = relevantDocs
          .map(doc => doc.content)
          .join('\n\n');
        summary = await this.docProcessor.summarizeContent(combinedContent);
      }

      // Create semantic clusters if we have enough docs
      let clusters;
      if (relevantDocs.length >= 3) {
        clusters = await this.clustering.clusterDocuments(
          relevantDocs.map(doc => doc.id)
        );
      }

      // Enhance the prompt with context
      const enhancedPrompt = await this.ragUtils.enhancePrompt(
        message,
        relevantDocs.map(doc => doc.content).join('\n')
      );

      return {
        enhancedPrompt,
        context: {
          relevantDocs,
          summary,
          clusters
        }
      };
    } catch (error) {
      thoughtLogger.log('error', 'Context enhancement failed', { error });
      return {
        enhancedPrompt: message,
        context: {
          relevantDocs: []
        }
      };
    }
  }

  async saveMessageContext(
    messageId: string,
    content: string,
    response: string
  ): Promise<void> {
    try {
      const metadata = await this.docProcessor.extractMetadata(content, 'chat-message');
      await this.vectorStore.addDocument(content, {
        ...metadata,
        messageId,
        type: 'chat',
        response
      });
    } catch (error) {
      thoughtLogger.log('error', 'Failed to save message context', { error });
    }
  }
} 