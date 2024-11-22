import { RedisService } from '../redis/redis-service';

export class CacheManager {
  private redis = RedisService.getInstance();

  async getCachedData<T>(key: string): Promise<T | null> {
    return await this.redis.get<T>(key);
  }

  async setCachedData<T>(key: string, data: T, ttl?: number): Promise<boolean> {
    return await this.redis.set(key, data, ttl);
  }

  async clearCache(): Promise<boolean> {
    return await this.redis.clearCache();
  }
} 