import { FileProcessor } from './file-processor';
import { DocumentChunker } from './document-chunker';
import { HybridVectorStore } from '../vectors/hybrid-store';
import { thoughtLogger } from './logger';
import { AppError } from '../error';

export interface BatchProcessingOptions {
  chunkSize?: number;
  overlap?: number;
  batchSize?: number;
  onProgress?: (progress: number) => void;
}

export class BatchProcessor {
  constructor(private vectorStore: HybridVectorStore) {}

  async processBatch(
    files: File[],
    options: BatchProcessingOptions = {}
  ): Promise<string[]> {
    const {
      chunkSize = 1500,
      overlap = 200,
      batchSize = 5,
      onProgress
    } = options;

    const documentIds: string[] = [];
    let processedCount = 0;

    try {
      // Process files in batches
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const processedBatch = await Promise.all(
          batch.map(async (file) => {
            try {
              const { text, metadata } = await FileProcessor.processFile(file);
              
              // Chunk the document based on type
              const chunks = metadata.mimeType.includes('markdown') 
                ? await DocumentChunker.chunkMarkdown(text, { maxChunkSize: chunkSize, overlap })
                : metadata.mimeType.includes('javascript') || metadata.mimeType.includes('typescript')
                ? await DocumentChunker.chunkCode(text, { maxChunkSize: chunkSize, overlap })
                : await DocumentChunker.chunkDocument(text, { maxChunkSize: chunkSize, overlap });

              // Store chunks with metadata
              const chunkIds = await Promise.all(
                chunks.map(async (chunk, index) => {
                  const id = await this.vectorStore.addDocument(chunk, {
                    ...metadata,
                    chunkIndex: index,
                    totalChunks: chunks.length,
                    parentFile: file.name
                  });
                  return id;
                })
              );

              processedCount++;
              if (onProgress) {
                onProgress((processedCount / files.length) * 100);
              }

              return chunkIds;
            } catch (error) {
              thoughtLogger.log('error', 'File processing failed', { 
                filename: file.name, 
                error 
              });
              return [];
            }
          })
        );

        documentIds.push(...processedBatch.flat());
      }

      return documentIds;
    } catch (error) {
      thoughtLogger.log('error', 'Batch processing failed', { error });
      throw new AppError('Failed to process batch', 'PROCESSING_ERROR');
    }
  }

  async summarizeDocument(documentIds: string[]): Promise<string> {
    try {
      const chunks = await Promise.all(
        documentIds.map(id => this.vectorStore.getDocument(id))
      );

      // TODO: Implement document summarization using an LLM
      // This is a placeholder for now
      return chunks
        .filter(chunk => chunk?.metadata?.chunkIndex === 0)
        .map(chunk => chunk?.content)
        .join('\n\n');
    } catch (error) {
      thoughtLogger.log('error', 'Document summarization failed', { error });
      throw new AppError('Failed to summarize document', 'PROCESSING_ERROR');
    }
  }
} 