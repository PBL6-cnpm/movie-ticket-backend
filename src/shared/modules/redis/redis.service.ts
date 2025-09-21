/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@InjectRedis() public readonly redis: Redis) {
    this.redis
      .ping()
      .then((res) => {
        this.logger.log(`Redis PING response: ${res}`);
      })
      .catch((err) => {
        this.logger.error('Failed to ping Redis on startup', err.stack);
      });
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
    this.logger.log('Redis connection closed gracefully');
  }

  async set<T>(key: string, value: T, ttl: number = 60): Promise<string> {
    try {
      const data = typeof value === 'string' ? value : JSON.stringify(value);
      return await this.redis.set(key, data, 'EX', ttl);
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error.stack);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error.stack);
      throw error;
    }
  }

  async del(keys: string | string[]): Promise<number> {
    try {
      const keysToDelete = Array.isArray(keys) ? keys : [keys];

      if (keysToDelete.length === 0) {
        return 0;
      }

      return await this.redis.del(...keysToDelete);
    } catch (error) {
      this.logger.error(`Error deleting key(s) ${JSON.stringify(keys)}:`, error.stack);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key}:`, error.stack);
      throw error;
    }
  }

  async flushAll(): Promise<'OK'> {
    try {
      this.logger.warn('Flushing all keys from the current Redis database');
      return await this.redis.flushdb();
    } catch (error) {
      this.logger.error(`Error flushing all keys:`, error.stack);
      throw error;
    }
  }
}
