interface RedisCacheConfig {
    host: string;
    port: number;
    password: string;
    ttl: number;
    maxMemory: string;
    evictionPolicy: 'allkeys-lru' | 'volatile-lru';
  }
  
  export const redisCacheConfig: RedisCacheConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    ttl: 3600,
    maxMemory: '2gb',
    evictionPolicy: 'volatile-lru'
};
