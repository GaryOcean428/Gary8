import { thoughtLogger } from '../../logging/thought-logger';

export class RateLimiter {
  private requestTimes: number[] = [];
  private tokenCounts: number[] = [];
  private readonly requestsPerMinute: number;
  private readonly tokensPerMinute: number;

  constructor(requestsPerMinute: number, tokensPerMinute: number) {
    this.requestsPerMinute = requestsPerMinute;
    this.tokensPerMinute = tokensPerMinute;
  }

  async checkRateLimit(tokenCount: number): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean up old entries
    this.requestTimes = this.requestTimes.filter(time => time > oneMinuteAgo);
    this.tokenCounts = this.tokenCounts.filter((_, i) => this.requestTimes[i] > oneMinuteAgo);

    // Check request limit
    if (this.requestTimes.length >= this.requestsPerMinute) {
      const waitTime = this.requestTimes[0] + 60000 - now;
      thoughtLogger.log('warning', `Rate limit exceeded, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Check token limit
    const totalTokens = this.tokenCounts.reduce((sum, count) => sum + count, 0) + tokenCount;
    if (totalTokens > this.tokensPerMinute) {
      throw new Error('Token rate limit exceeded');
    }

    // Record new request
    this.requestTimes.push(now);
    this.tokenCounts.push(tokenCount);
  }

  getRateLimitStatus(): { 
    requestsRemaining: number;
    tokensRemaining: number;
    resetInMs: number;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    const activeRequests = this.requestTimes.filter(time => time > oneMinuteAgo).length;
    const activeTokens = this.tokenCounts
      .filter((_, i) => this.requestTimes[i] > oneMinuteAgo)
      .reduce((sum, count) => sum + count, 0);

    return {
      requestsRemaining: this.requestsPerMinute - activeRequests,
      tokensRemaining: this.tokensPerMinute - activeTokens,
      resetInMs: this.requestTimes.length ? Math.max(0, this.requestTimes[0] + 60000 - now) : 0
    };
  }

  reset(): void {
    this.requestTimes = [];
    this.tokenCounts = [];
  }
}