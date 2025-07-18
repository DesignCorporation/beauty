/**
 * TP-06: Rate Limiting Service для Messaging Hub
 * Использует Redis Token Bucket algorithm для ограничения сообщений per salon
 */

import Redis from 'ioredis';
import { RateLimitStatus } from '../types/messaging';

export class MessageRateLimiter {
  private redis: Redis;
  private keyPrefix = 'rate_limit:messaging:';

  constructor(redisUrl?: string) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
  }

  /**
   * Проверяет и обновляет rate limit для салона
   * Token bucket algorithm: salon получает rateLimitPerMinute токенов каждую минуту
   */
  async checkRateLimit(
    salonId: string,
    rateLimitPerMinute: number = 10,
    cost: number = 1
  ): Promise<RateLimitStatus> {
    const key = `${this.keyPrefix}${salonId}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 минута
    const windowStart = Math.floor(now / windowMs) * windowMs;

    // Lua скрипт для атомарной операции rate limiting
    const luaScript = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local cost = tonumber(ARGV[2])
      local window_start = tonumber(ARGV[3])
      local ttl = tonumber(ARGV[4])
      
      local current = redis.call('HMGET', key, 'count', 'window')
      local count = tonumber(current[1]) or 0
      local window = tonumber(current[2]) or 0
      
      -- Если новое окно, сбрасываем счетчик
      if window ~= window_start then
        count = 0
        window = window_start
      end
      
      local remaining = limit - count
      local allowed = remaining >= cost
      
      if allowed then
        count = count + cost
        redis.call('HMSET', key, 'count', count, 'window', window)
        redis.call('EXPIRE', key, ttl)
      end
      
      return {
        allowed and 1 or 0,
        remaining,
        window_start + 60000
      }
    `;

    const result = await this.redis.eval(
      luaScript,
      1,
      key,
      rateLimitPerMinute.toString(),
      cost.toString(),
      windowStart.toString(),
      '120' // TTL 2 минуты
    ) as [number, number, number];

    const [allowed, remaining, resetTime] = result;

    return {
      allowed: allowed === 1,
      remaining: Math.max(0, remaining),
      resetTime: new Date(resetTime),
      limitPerMinute: rateLimitPerMinute
    };
  }

  /**
   * Получает текущий статус rate limit без изменения счетчика
   */
  async getRateLimitStatus(
    salonId: string,
    rateLimitPerMinute: number = 10
  ): Promise<RateLimitStatus> {
    const key = `${this.keyPrefix}${salonId}`;
    const now = Date.now();
    const windowMs = 60 * 1000;
    const windowStart = Math.floor(now / windowMs) * windowMs;

    const current = await this.redis.hmget(key, 'count', 'window');
    const count = parseInt(current[0] || '0');
    const window = parseInt(current[1] || '0');

    // Если новое окно, счетчик сброшен
    const actualCount = window === windowStart ? count : 0;
    const remaining = Math.max(0, rateLimitPerMinute - actualCount);

    return {
      allowed: remaining > 0,
      remaining,
      resetTime: new Date(windowStart + windowMs),
      limitPerMinute: rateLimitPerMinute
    };
  }

  /**
   * Сбрасывает rate limit для салона (для тестирования или админских операций)
   */
  async resetRateLimit(salonId: string): Promise<void> {
    const key = `${this.keyPrefix}${salonId}`;
    await this.redis.del(key);
  }

  /**
   * Получает статистику rate limiting для нескольких салонов
   */
  async getRateLimitStats(salonIds: string[]): Promise<Record<string, RateLimitStatus>> {
    const stats: Record<string, RateLimitStatus> = {};
    
    for (const salonId of salonIds) {
      stats[salonId] = await this.getRateLimitStatus(salonId);
    }
    
    return stats;
  }

  /**
   * Закрывает Redis соединение
   */
  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}

// Singleton instance для использования в приложении
let rateLimiter: MessageRateLimiter | null = null;

export function getMessageRateLimiter(): MessageRateLimiter {
  if (!rateLimiter) {
    rateLimiter = new MessageRateLimiter();
  }
  return rateLimiter;
}

// Utility функция для проверки rate limit с логированием
export async function checkMessageRateLimit(
  salonId: string,
  rateLimitPerMinute?: number,
  cost: number = 1
): Promise<{ allowed: boolean; status: RateLimitStatus }> {
  const limiter = getMessageRateLimiter();
  const status = await limiter.checkRateLimit(salonId, rateLimitPerMinute, cost);
  
  if (!status.allowed) {
    console.warn(`Rate limit exceeded for salon ${salonId}:`, {
      remaining: status.remaining,
      resetTime: status.resetTime,
      limitPerMinute: status.limitPerMinute
    });
  }
  
  return { allowed: status.allowed, status };
}
