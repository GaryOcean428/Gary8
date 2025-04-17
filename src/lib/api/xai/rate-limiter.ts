/**
 * Rate limiter for API requests
 */
export class RateLimiter {
  private requestTimes: number[] = [];
  private tokenCounts: number[] = [];
  private readonly requestsPerMinute: number;
  private readonly tokensPerMinute: number;

  constructor(requestsPerMinute: number, tokensPerMinute: number) {
    this.requestsPerMinute = requestsPerMinute;
    this.tokensPerMinute = tokensPerMinute;
  }

  /**
   * Checks if request can be made within rate limits
   * @param tokenCount Estimated token count for request
   * @throws {Error} If rate limit would be exceeded
   */
  async checkRateLimit(tokenCount: number): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean up old entries
    this.requestTimes = this.requestTimes.filter(time => time > oneMinuteAgo);
    this.tokenCounts = this.tokenCounts.filter((_, i) => this.requestTimes[i] > oneMinuteAgo);

    // Check request limit
    if (this.requestTimes.length >= this.requestsPerMinute) {
      const oldestRequest = Math.min(...this.requestTimes);
      const waitTime = oldestRequest + 60000 - now;
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

  /**
   * Gets current rate limit status
   */
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
}