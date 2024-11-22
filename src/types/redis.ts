export interface RedisConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  tls?: {
    rejectUnauthorized: boolean;
  };
  retryStrategy?: (times: number) => number | void;
}

export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<'OK'>;
  del(key: string): Promise<number>;
  flushall(): Promise<'OK'>;
}

export interface RedisCacheConfig {
  ttl: number;
  maxMemory: string;
  evictionPolicy: 'allkeys-lru' | 'volatile-lru';
}

export interface RedisServiceOptions {
  defaultTTL?: number;
  source?: string;
  namespace?: string;
}

export type RedisValue = string | number | boolean | object | null;

export interface RedisError extends Error {
  code?: string;
  errno?: number;
  syscall?: string;
  hostname?: string;
  command?: string;
} 