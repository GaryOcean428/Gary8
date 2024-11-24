import { Toolhouse, Provider } from 'toolhouse';
import { thoughtLogger } from '../logging/thought-logger';
import { AppError } from '../errors/AppError';

export class LlamaIndexService {
  private static instance: LlamaIndexService;
  private toolhouse: Toolhouse;
  private initialized: boolean = false;

  private constructor() {
    this.toolhouse = new Toolhouse({ 
      provider: Provider.LLAMAINDEX,
      apiKey: process.env.TOOLHOUSE_API_KEY
    });
  }

  static getInstance(): LlamaIndexService {
    if (!LlamaIndexService.instance) {
      LlamaIndexService.instance = new LlamaIndexService();
    }
    return LlamaIndexService.instance;
  }

  async initialize(): Promise<void> {
    try {
      if (this.initialized) return;
      
      thoughtLogger.log('info', 'Initializing LlamaIndex service');
      
      // Get tools with search and page contents bundle
      const tools = await this.toolhouse.getTools({
        bundle: "search_and_get_page_contents"
      });

      this.initialized = true;
      thoughtLogger.log('success', 'LlamaIndex service initialized', { 
        toolCount: tools.length 
      });
    } catch (error) {
      thoughtLogger.log('error', 'Failed to initialize LlamaIndex service', { error });
      throw new AppError('Failed to initialize LlamaIndex service', 'INITIALIZATION_ERROR');
    }
  }

  async searchAndAnalyze(query: string): Promise<string> {
    try {
      if (!this.initialized) await this.initialize();

      thoughtLogger.log('info', 'Executing search and analyze query', { query });
      
      const tools = await this.toolhouse.getTools({
        bundle: "search_and_get_page_contents"
      });

      // Execute the search and analysis
      const response = await this.toolhouse.execute(tools, query);

      thoughtLogger.log('success', 'Search and analysis completed');
      return response;
    } catch (error) {
      thoughtLogger.log('error', 'Search and analysis failed', { error });
      throw new AppError('Search and analysis failed', 'EXECUTION_ERROR');
    }
  }
} 