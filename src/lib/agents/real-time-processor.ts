import { thoughtLogger } from '../logging/thought-logger';
import { ModelConnector } from '../connectors/model-connector';
import { StreamProcessor } from '../streaming';
import type { Message } from '../types';

export class RealTimeProcessor {
  private modelConnector: ModelConnector;
  private streamProcessor: StreamProcessor;
  private activeStreams: Map<string, AbortController> = new Map();

  constructor() {
    this.modelConnector = ModelConnector.getInstance();
    this.streamProcessor = new StreamProcessor();
  }

  async processInRealTime(
    message: Message,
    onProgress: (content: string) => void,
    onThought: (thought: string) => void
  ): Promise<void> {
    const streamId = crypto.randomUUID();
    const abortController = new AbortController();
    this.activeStreams.set(streamId, abortController);

    thoughtLogger.log('plan', 'Starting real-time processing', { streamId });

    try {
      // Process message in chunks for real-time response
      const chunks = this.splitIntoChunks(message.content);
      
      for (const chunk of chunks) {
        if (abortController.signal.aborted) {
          thoughtLogger.log('observation', 'Processing aborted', { streamId });
          break;
        }

        // Process chunk and emit progress
        const response = await this.processChunk(chunk);
        onProgress(response.content);

        // Emit thought process
        if (response.thought) {
          onThought(response.thought);
        }

        // Small delay between chunks for natural flow
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      thoughtLogger.log('success', 'Real-time processing completed', { streamId });
    } catch (error) {
      thoughtLogger.log('error', 'Real-time processing failed', { streamId, error });
      throw error;
    } finally {
      this.activeStreams.delete(streamId);
    }
  }

  private splitIntoChunks(content: string): string[] {
    // Split content into manageable chunks for real-time processing
    return content.match(/.{1,100}/g) || [];
  }

  private async processChunk(chunk: string): Promise<{
    content: string;
    thought?: string;
  }> {
    // Process individual chunk and generate response
    const response = await this.modelConnector.routeToModel(
      [{ role: 'user', content: chunk }],
      {
        model: 'grok-beta',
        temperature: 0.7,
        maxTokens: 100,
        confidence: 0.9
      }
    );

    return {
      content: response.content,
      thought: this.extractThought(response.content)
    };
  }

  private extractThought(content: string): string | undefined {
    // Extract thought process from response if present
    const thoughtMatch = content.match(/\[THOUGHT\](.*?)\[\/THOUGHT\]/s);
    return thoughtMatch ? thoughtMatch[1].trim() : undefined;
  }

  cancelStream(streamId: string): void {
    const controller = this.activeStreams.get(streamId);
    if (controller) {
      controller.abort();
      this.activeStreams.delete(streamId);
      thoughtLogger.log('observation', 'Stream cancelled', { streamId });
    }
  }

  getActiveStreamCount(): number {
    return this.activeStreams.size;
  }
}