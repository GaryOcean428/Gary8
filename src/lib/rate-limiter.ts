interface RateLimiterOptions {
  maxRequests: number;
  interval: number;
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
      const oldestTimestamp = this.timestamps[0];
      const waitTime = this.options.interval - (now - oldestTimestamp);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.timestamps.push(now);
  }

  reset(): void {
    this.timestamps = [];
  }
}