import { BaseAgent } from './core/base-agent';
import { AgentConfig, AgentMessage } from './agent-types';
import { thoughtLogger } from '../utils/logger';
import { ErrorHandler } from '../error/error-handler';

export class QualityAssuranceAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super({
      ...config,
      role: 'critic',
      capabilities: ['analysis', 'testing', 'validation']
    });
  }

  async validateCode(code: string): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    return await ErrorHandler.handleWithRetry(async () => {
      thoughtLogger.info('Validating code', { agentId: this.config.id });

      const analysis = await this.llmClient.analyze(
        code,
        'Analyze this code for potential issues and improvements'
      );

      return {
        isValid: analysis.issues.length === 0,
        issues: analysis.issues,
        suggestions: analysis.suggestions
      };
    }, 'validate_code');
  }

  async generateTests(code: string): Promise<string> {
    return await ErrorHandler.handleWithRetry(async () => {
      thoughtLogger.info('Generating tests', { agentId: this.config.id });

      return await this.llmClient.generate(
        code,
        'Generate comprehensive test cases for this code'
      );
    }, 'generate_tests');
  }

  async reviewPullRequest(diff: string): Promise<{
    approved: boolean;
    comments: string[];
    suggestions: string[];
  }> {
    return await ErrorHandler.handleWithRetry(async () => {
      thoughtLogger.info('Reviewing PR', { agentId: this.config.id });

      const review = await this.llmClient.analyze(
        diff,
        'Review this pull request diff and provide feedback'
      );

      return {
        approved: review.issues.length === 0,
        comments: review.comments,
        suggestions: review.suggestions
      };
    }, 'review_pr');
  }
}
