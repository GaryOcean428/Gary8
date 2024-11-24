import { ModelAPI } from '../api/model-api';
import { thoughtLogger } from './logger';
import { AppError } from '../error';

export class DocumentProcessor {
  private modelApi: ModelAPI;

  constructor() {
    this.modelApi = new ModelAPI();
  }

  async summarizeContent(content: string, options = {
    maxLength: 250,
    style: 'concise' as 'concise' | 'detailed' | 'technical'
  }): Promise<string> {
    const prompts = {
      concise: "Provide a brief summary of the main points:",
      detailed: "Provide a comprehensive summary including key details and examples:",
      technical: "Provide a technical summary focusing on implementation details, technologies, and methodologies:"
    };

    try {
      const response = await this.modelApi.chat([
        {
          role: 'system',
          content: `You are a document summarization expert. ${prompts[options.style]}`
        },
        {
          role: 'user',
          content: content
        }
      ]);

      return response.content;
    } catch (error) {
      thoughtLogger.log('error', 'Document summarization failed', { error });
      throw new AppError('Failed to summarize document', 'PROCESSING_ERROR');
    }
  }

  async extractMetadata(content: string, filename: string): Promise<Record<string, any>> {
    try {
      const prompt = `Extract key metadata from this document. Include:
        - Main topics/themes
        - Key technologies/frameworks mentioned
        - Document type/category
        - Technical complexity (low/medium/high)
        - Target audience
        - Any version numbers or dates mentioned
        Format as JSON.`;

      const response = await this.modelApi.chat([
        {
          role: 'system',
          content: 'You are a metadata extraction expert. Return only valid JSON.'
        },
        {
          role: 'user',
          content: `${prompt}\n\nContent: ${content}`
        }
      ]);

      return JSON.parse(response.content);
    } catch (error) {
      thoughtLogger.log('error', 'Metadata extraction failed', { error });
      return {
        filename,
        type: 'unknown',
        complexity: 'medium',
        extractionError: true
      };
    }
  }
} 