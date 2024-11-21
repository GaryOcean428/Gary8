import { thoughtLogger } from '../logging/thought-logger';
import { SearchResult } from '../types/search';
import { VectorStore } from '../memory/vector-store';
import { config } from '../config';

export class RagProcessor {
  private vectorStore: VectorStore;

  constructor() {
    this.vectorStore = new VectorStore();
  }

  async process(results: SearchResult[]): Promise<SearchResult[]> {
    thoughtLogger.log('plan', 'Processing search results with RAG', {
      resultCount: results.length
    });

    try {
      // Store results in vector store for retrieval
      const storedResults = await Promise.all(
        results.map(async result => {
          const vectorId = await this.vectorStore.addDocument(result.content);
          return { ...result, vectorId };
        })
      );

      // Perform similarity search to find relevant content
      const enhancedResults = await Promise.all(
        storedResults.map(async result => {
          const similarContent = await this.vectorStore.search(
            result.content,
            0.7,
            3
          );

          // Enhance result with related content
          return {
            ...result,
            content: this.combineContent(result.content, similarContent)
          };
        })
      );

      thoughtLogger.log('success', 'RAG processing complete', {
        enhancedCount: enhancedResults.length
      });

      return enhancedResults;
    } catch (error) {
      thoughtLogger.log('error', 'RAG processing failed', { error });
      return results; // Return original results if RAG fails
    }
  }

  private combineContent(
    originalContent: string,
    similarContent: Array<{ content: string; score: number }>
  ): string {
    let combined = originalContent + '\n\n';

    if (similarContent.length > 0) {
      combined += '### Related Information\n\n';
      similarContent.forEach(({ content, score }) => {
        if (score > 0.8 && content !== originalContent) {
          combined += content + '\n\n';
        }
      });
    }

    return combined.trim();
  }
}