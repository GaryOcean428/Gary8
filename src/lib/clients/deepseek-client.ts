import { thoughtLogger } from '../utils/logger';
import { ErrorHandler } from '../error/error-handler';
import { MonitoringService } from '../monitoring/monitoring-service';

interface DeepSeekConfig {
  model: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stop?: string[];
  stream?: boolean;
}

interface DeepSeekResponse {
  id: string;
  choices: {
    text: string;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepSeekClient {
  private static instance: DeepSeekClient;
  private apiKey: string;
  private baseUrl: string;
  private monitoring: MonitoringService;

  private defaultConfig: DeepSeekConfig = {
    model: 'deepseek-coder-33b-instruct',
    temperature: 0.7,
    top_p: 0.95,
    max_tokens: 4096,
    stream: false
  };

  private constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY!;
    this.baseUrl = 'https://api.deepseek.com/v1';
    this.monitoring = MonitoringService.getInstance();
  }

  static getInstance(): DeepSeekClient {
    if (!this.instance) {
      this.instance = new DeepSeekClient();
    }
    return this.instance;
  }

  async generateCode(prompt: string, config?: Partial<DeepSeekConfig>): Promise<string> {
    return await ErrorHandler.handleWithRetry(async () => {
      const response = await this.makeRequest('completions', {
        ...this.defaultConfig,
        ...config,
        prompt: this.formatCodePrompt(prompt)
      });

      return response.choices[0].text;
    }, 'generate code');
  }

  async reviewCode(code: string, language: string): Promise<any> {
    return await ErrorHandler.handleWithRetry(async () => {
      const prompt = this.formatReviewPrompt(code, language);
      const response = await this.makeRequest('completions', {
        ...this.defaultConfig,
        temperature: 0.3, // Lower temperature for more focused review
        prompt
      });

      return this.parseReviewResponse(response.choices[0].text);
    }, 'review code');
  }

  async generateTests(code: string): Promise<string> {
    return await ErrorHandler.handleWithRetry(async () => {
      const prompt = this.formatTestPrompt(code);
      const response = await this.makeRequest('completions', {
        ...this.defaultConfig,
        temperature: 0.5,
        prompt
      });

      return response.choices[0].text;
    }, 'generate tests');
  }

  private async makeRequest(endpoint: string, data: any): Promise<DeepSeekResponse> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      thoughtLogger.error('DeepSeek API error', { error, endpoint });
      throw new Error(`DeepSeek API error: ${error.message}`);
    }

    return await response.json();
  }

  private formatCodePrompt(prompt: string): string {
    return `You are an expert programmer. Generate clean, efficient, and well-documented code based on the following request:

${prompt}

Please provide the code with appropriate comments and error handling.`;
  }

  private formatReviewPrompt(code: string, language: string): string {
    return `Review the following ${language} code for:
1. Code quality and best practices
2. Potential bugs and security issues
3. Performance optimizations
4. Architecture improvements

Code to review:
\`\`\`${language}
${code}
\`\`\`

Provide a structured analysis with specific issues and suggestions.`;
  }

  private formatTestPrompt(code: string): string {
    return `Generate comprehensive test cases for the following code:

${code}

Include:
1. Unit tests
2. Edge cases
3. Error scenarios
4. Integration test examples`;
  }

  private parseReviewResponse(text: string): any {
    try {
      // Extract structured data from the response
      const issues = text.match(/Issues:([\s\S]*?)(?=Suggestions:|$)/)?.[1]
        .trim()
        .split('\n')
        .filter(Boolean) || [];

      const suggestions = text.match(/Suggestions:([\s\S]*?)$/)?.[1]
        .trim()
        .split('\n')
        .filter(Boolean) || [];

      return {
        issues,
        suggestions,
        quality: this.calculateQualityScore(issues)
      };
    } catch (error) {
      thoughtLogger.error('Failed to parse review response', { error, text });
      return {
        issues: [],
        suggestions: [],
        quality: 0
      };
    }
  }

  private calculateQualityScore(issues: string[]): number {
    const baseScore = 100;
    const deductionPerIssue = 5;
    return Math.max(0, baseScore - (issues.length * deductionPerIssue));
  }
} 