import { thoughtLogger } from '../logging/thought-logger';

interface RateLimiterOptions {
  maxRequests: number;
  interval: number; // in milliseconds
}

export class RateLimiter {
  private timestamps: number[] = [];
  private options: RateLimiterOptions;

  constructor(options: RateLimiterOptions) {
    this.options = options;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(
      time => now - time < this.options.interval
    );

    if (this.timestamps.length >= this.options.maxRequests) {
      const waitTime = this.options.interval - (now - this.timestamps[0]);
      thoughtLogger.log('warning', `Rate limit exceeded, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.timestamps.push(now);
  }

  getRemainingRequests(): number {
    const now = Date.now();
    const validTimestamps = this.timestamps.filter(
      time => now - time < this.options.interval
    );
    return Math.max(0, this.options.maxRequests - validTimestamps.length);
  }

  reset(): void {
    this.timestamps = [];
  }
}