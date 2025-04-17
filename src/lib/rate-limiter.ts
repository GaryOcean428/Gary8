interface RateLimiterOptions {
  maxRequests: number;
  interval: number;
}

export class RateLimiter {
  private timestamps: number[] = [];
  private options: RateLimiterOptions;
  private waitingPromises: Array<{ resolve: () => void; timestamp: number }> = [];

  constructor(options: RateLimiterOptions) {
    this.options = options;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    
    // Clean up old timestamps
    this.timestamps = this.timestamps.filter(
      time => now - time < this.options.interval
    );

    // If under the limit, proceed immediately
    if (this.timestamps.length < this.options.maxRequests) {
      this.timestamps.push(now);
      return;
    }

    // Otherwise, calculate wait time
    const oldestTimestamp = this.timestamps[0];
    const waitTime = this.options.interval - (now - oldestTimestamp) + 50; // Add 50ms buffer

    // Create a promise that will resolve after waitTime
    return new Promise<void>(resolve => {
      const waitPromise = { resolve, timestamp: now + waitTime };
      this.waitingPromises.push(waitPromise);
      
      // Set timeout to resolve this promise after waitTime
      setTimeout(() => {
        const index = this.waitingPromises.indexOf(waitPromise);
        if (index !== -1) {
          this.waitingPromises.splice(index, 1);
          this.timestamps.push(Date.now());
          resolve();
        }
      }, waitTime);
    });
  }

  getStatus(): { current: number; max: number; nextSlotIn: number } {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(time => now - time < this.options.interval);
    
    let nextSlotIn = 0;
    if (this.timestamps.length >= this.options.maxRequests) {
      nextSlotIn = this.options.interval - (now - this.timestamps[0]);
    }
    
    return {
      current: this.timestamps.length,
      max: this.options.maxRequests,
      nextSlotIn
    };
  }

  reset(): void {
    this.timestamps = [];
    
    // Resolve all waiting promises
    for (const { resolve } of this.waitingPromises) {
      resolve();
    }
    this.waitingPromises = [];
  }
}