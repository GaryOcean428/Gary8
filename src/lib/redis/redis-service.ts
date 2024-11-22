import { redisClient } from './redis-client.js';
import { thoughtLogger } from '../logging/thought-logger.js';

export class RedisService {
  private static instance: RedisService;
  private readonly defaultTTL = 3600; // 1 hour

  private constructor() {
    thoughtLogger.log('info', 'Initializing Redis service', {}, { source: 'redis-service' });
  }

  static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      thoughtLogger.log('error', 'Redis get error', { error, key }, { source: 'redis-service' });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl = this.defaultTTL): Promise<boolean> {
    try {
      const stringValue = JSON.stringify(value);
      await redisClient.set(key, stringValue, 'EX', ttl);
      return true;
    } catch (error) {
      thoughtLogger.log('error', 'Redis set error', { error, key }, { source: 'redis-service' });
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      thoughtLogger.log('error', 'Redis delete error', { error, key }, { source: 'redis-service' });
      return false;
    }
  }

  async clearCache(): Promise<boolean> {
    try {
      await redisClient.flushall();
      return true;
    } catch (error) {
      thoughtLogger.log('error', 'Redis clear cache error', { error }, { source: 'redis-service' });
      return false;
    }
  }
} 