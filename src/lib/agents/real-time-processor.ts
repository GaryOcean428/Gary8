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
    _message: Message,
    _onProgress: (content: string) => void,
    _onThought: (thought: string) => void
  ): Promise<void> {
    const streamId = crypto.randomUUID();
    const abortController = new AbortController();
    this.activeStreams.set(streamId, abortController);

    thoughtLogger.log('plan', 'Starting real-time processing', { streamId });

    try {
      // Process message in chunks for real-time response
      const chunks = this.splitIntoChunks(_message.content);
      
      for (const chunk of chunks) {
        if (abortController.signal.aborted) {
          thoughtLogger.log('observation', 'Processing aborted', { streamId });
          break;
        }

        // Process chunk and emit progress
        const response = await this.processChunk(chunk);
        _onProgress(response.content);

        // Emit thought process
        if (response.thought) {
          _onThought(response.thought);
        }

        // Small delay between chunks for natural flow
        await new Promise(_resolve => setTimeout(_resolve, 100));
      }

      thoughtLogger.log('success', 'Real-time processing completed', { streamId });
    } catch (error) {
      thoughtLogger.log('error', 'Real-time processing failed', { streamId, error });
      throw error;
    } finally {
      this.activeStreams.delete(streamId);
    }
  }

  private splitIntoChunks(_content: string): string[] {
    // Split content into manageable chunks for real-time processing
    return _content.match(/.{1,100}/g) || [];
  }

  private async processChunk(_chunk: string): Promise<{
    content: string;
    thought?: string;
  }> {
    // Process individual chunk and generate response
    const response = await this.modelConnector.routeToModel(
      [{ role: 'user', content: _chunk }],
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

  private extractThought(_content: string): string | undefined {
    // Extract thought process from response if present
    const thoughtMatch = _content.match(/\[THOUGHT\](.*?)\[\/THOUGHT\]/s);
    return thoughtMatch ? thoughtMatch[1].trim() : undefined;
  }

  cancelStream(_streamId: string): void {
    const controller = this.activeStreams.get(_streamId);
    if (controller) {
      controller.abort();
      this.activeStreams.delete(_streamId);
      thoughtLogger.log('observation', 'Stream cancelled', { _streamId });
    }
  }

  getActiveStreamCount(): number {
    return this.activeStreams.size;
  }
}