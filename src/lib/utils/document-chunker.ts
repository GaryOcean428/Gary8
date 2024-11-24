import { thoughtLogger } from '../utils/logger';

export interface ChunkOptions {
  maxChunkSize?: number;
  overlap?: number;
  separator?: string;
  preserveLineBreaks?: boolean;
}

export class DocumentChunker {
  static async chunkDocument(
    text: string,
    options: ChunkOptions = {}
  ): Promise<string[]> {
    const {
      maxChunkSize = 1500,
      overlap = 200,
      separator = ' ',
      preserveLineBreaks = true
    } = options;

    try {
      // Preserve important formatting
      const normalizedText = preserveLineBreaks 
        ? text.replace(/\n\n+/g, '\n\n').replace(/\s+/g, ' ')
        : text.replace(/\s+/g, ' ');

      const words = normalizedText.split(separator);
      const chunks: string[] = [];
      let currentChunk: string[] = [];
      let currentLength = 0;

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const wordLength = word.length + (currentChunk.length > 0 ? 1 : 0); // Add space if not first word

        if (currentLength + wordLength > maxChunkSize && currentChunk.length > 0) {
          // Store current chunk
          chunks.push(currentChunk.join(' '));
          
          // Start new chunk with overlap
          const overlapStart = Math.max(0, currentChunk.length - Math.floor(overlap / separator.length));
          currentChunk = currentChunk.slice(overlapStart);
          currentLength = currentChunk.join(' ').length;
        }

        currentChunk.push(word);
        currentLength += wordLength;
      }

      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
      }

      return chunks;
    } catch (error) {
      thoughtLogger.log('error', 'Document chunking failed', { error });
      throw new Error(`Failed to chunk document: ${error.message}`);
    }
  }

  static async chunkMarkdown(
    markdown: string,
    options: ChunkOptions = {}
  ): Promise<string[]> {
    // Special handling for markdown to preserve structure
    const sections = markdown.split(/(?=^#{1,6}\s)/m);
    const chunks: string[] = [];

    for (const section of sections) {
      const sectionChunks = await this.chunkDocument(section, {
        ...options,
        preserveLineBreaks: true
      });
      chunks.push(...sectionChunks);
    }

    return chunks;
  }

  static async chunkCode(
    code: string,
    options: ChunkOptions = {}
  ): Promise<string[]> {
    // Special handling for code to preserve structure
    const functions = code.split(/(?=\n(?:export\s+)?(?:async\s+)?function|\n(?:export\s+)?class|\n(?:export\s+)?const\s+\w+\s+=\s+(?:async\s+)?function)/);
    const chunks: string[] = [];

    for (const func of functions) {
      if (func.trim()) {
        chunks.push(func.trim());
      }
    }

    return chunks;
  }
} 