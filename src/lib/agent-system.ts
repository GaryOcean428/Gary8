import { Message } from './types';
import { APIClient } from './api-client';
import { SearchService } from './services/search-service';
import { ErrorHandler } from './errors/ErrorHandler';
import { ChatContext } from './memory/chat-context';
import { VectorMemory } from './memory/vector-memory';
import { ModelRouter } from './routing/router';
import { toolRegistry } from './tools/tool-registry';
import { thoughtLogger } from './logging/thought-logger';
import { RetryHandler } from './utils/RetryHandler';
import { performanceMonitor } from './utils/PerformanceMonitor';
import type { ProcessingState } from '../components/LoadingIndicator';

export class AgentSystem {
  private messages: Message[] = [];
  private apiClient: APIClient;
  private searchService: SearchService;
  private chatContext: ChatContext;
  private vectorMemory: VectorMemory;
  private router: ModelRouter;
  private retryHandler: RetryHandler;
  private isProcessing = false;
  private isPaused = false;
  private currentState: ProcessingState = 'thinking';

  private constructor() {
    try {
      this.apiClient = APIClient.getInstance();
      this.searchService = new SearchService();
      this.chatContext = new ChatContext();
      this.vectorMemory = new VectorMemory();
      this.router = new ModelRouter();
      this.retryHandler = new RetryHandler();
      thoughtLogger.log('success', 'Agent system components initialized');
    } catch (error) {
      thoughtLogger.log('error', 'Failed to initialize agent system components', { error });
      throw error;
    }
  }

  private static instance: AgentSystem | null = null;

  static getInstance(): AgentSystem {
    if (!AgentSystem.instance) {
      AgentSystem.instance = new AgentSystem();
    }
    return AgentSystem.instance;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.apiClient) {
      throw new Error('API client not initialized');
    }

    try {
      await this.apiClient.initialize();
    } catch (error) {
      thoughtLogger.log('error', 'Failed to initialize API client', { error });
      throw error;
    }
  }

  async processMessage(
    _content: string,
    _onProgress?: (content: string) => void,
    _onStateChange?: (state: ProcessingState) => void
  ): Promise<void> {
    if (this.isProcessing || this.isPaused) return;

    performanceMonitor.startMeasure('process_message', { contentLength: _content.length });
    this.isProcessing = true;
    thoughtLogger.log('plan', 'Processing new message');

    try {
      await this.ensureInitialized();

      const message: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        _content,
        timestamp: Date.now()
      };

      // Get context from memory
      await this.updateState('retrieving', _onStateChange);
      performanceMonitor.startMeasure('context_retrieval');
      const context = await this.chatContext.getRecentContext();
      const memoryResults = await this.vectorMemory.recall(_content);
      performanceMonitor.endMeasure('context_retrieval');

      // Search if needed
      let searchContext = '';
      if (this.searchService.needsSearch(_content)) {
        await this.updateState('searching', _onStateChange);
        performanceMonitor.startMeasure('web_search');
        try {
          searchContext = await this.searchService.search(_content);
          await this.updateState('synthesizing', _onStateChange);
        } catch (error) {
          thoughtLogger.log('critique', `Search failed: ${error}`);
        }
        performanceMonitor.endMeasure('web_search');
      }

      // Process message
      await this.updateState('thinking', _onStateChange);
      const systemMessage = this.buildSystemMessage(context, memoryResults, searchContext);

      // Use retry handler for API calls
      performanceMonitor.startMeasure('api_request');
      const response = await this.retryHandler.execute(async () => {
        return this.apiClient.chat(
          [systemMessage, message],
          _content => {
            if (!this.isPaused && _onProgress) {
              _onProgress(_content);
            }
          }
        );
      });
      performanceMonitor.endMeasure('api_request');

      // Store in memory
      if (response) {
        performanceMonitor.startMeasure('memory_storage');
        
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response,
          timestamp: Date.now()
        };

        this.messages.push(assistantMessage);
        this.chatContext.addMessage(assistantMessage);
        await this.vectorMemory.store(response, 'response');
        
        performanceMonitor.endMeasure('memory_storage');
      }

      thoughtLogger.log('success', 'Message processed successfully');
    } catch (error) {
      thoughtLogger.log('error', 'Message processing failed', { error });
      const handled = ErrorHandler.handle(error);
      throw new Error(handled.message);
    } finally {
      this.isProcessing = false;
      _onStateChange?.(undefined);
      performanceMonitor.endMeasure('process_message');
    }
  }

  private buildSystemMessage(
    _context: string,
    _memoryResults: Array<{ content: string }>,
    _searchContext: string
  ): Message {
    const memoryContext = _memoryResults
      .map(_mem => `Previous relevant information: ${_mem.content}`)
      .join('\n');

    return {
      id: 'system',
      role: 'system',
      content: [
        'You are Agent One, a helpful AI assistant. Keep responses concise and contextually relevant.',
        'Guidelines:',
        '- For greetings, respond naturally and briefly',
        '- Focus on the current context and user intent',
        '- Avoid unnecessary historical or encyclopedic information',
        '- If uncertain, ask for clarification',
        '- For medical queries, provide general educational information with clear disclaimers',
        '- Never provide specific medical advice or diagnoses',
        _context ? `Recent context:\n${_context}` : '',
        memoryContext ? `Memory context:\n${memoryContext}` : '',
        _searchContext ? `Search context:\n${_searchContext}` : ''
      ].filter(Boolean).join('\n\n'),
      timestamp: Date.now()
    };
  }

  private async updateState(
    _state: ProcessingState,
    _onStateChange?: (state: ProcessingState) => void
  ): Promise<void> {
    this.currentState = _state;
    _onStateChange?.(_state);
    await new Promise(_resolve => setTimeout(_resolve, 50));
  }

  setPaused(_paused: boolean): void {
    this.isPaused = _paused;
  }

  getMessages(): Message[] {
    return this.messages;
  }

  getCurrentState(): ProcessingState {
    return this.currentState;
  }
}