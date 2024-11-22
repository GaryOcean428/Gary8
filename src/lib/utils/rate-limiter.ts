class RateLimiter {
  private requests: Map<string, { count: number; timestamp: number }> = new Map();
  private readonly limit = 100; // requests
  private readonly window = 60 * 1000; // 1 minute in milliseconds

  async check(ip: string): Promise<boolean> {
    const now = Date.now();
    const record = this.requests.get(ip);

    if (!record) {
      this.requests.set(ip, { count: 1, timestamp: now });
      return true;
    }

    if (now - record.timestamp > this.window) {
      // Reset if window has passed
      this.requests.set(ip, { count: 1, timestamp: now });
      return true;
    }

    if (record.count >= this.limit) {
      throw new Error('Rate limit exceeded');
    }

    record.count++;
    return true;
  }
}

export const rateLimiter = new RateLimiter();
