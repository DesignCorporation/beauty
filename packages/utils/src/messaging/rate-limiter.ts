/**
 * Redis-based Rate Limiter for Beauty Platform Messaging Hub
 * 
 * Implements token bucket algorithm with tenant-specific limits
 * and burst handling for message rate limiting.
 */

import Redis from 'ioredis';
import { RateLimitConfig } from './types';

export class MessageRateLimiter {
  private redis: Redis;
  private defaultConfig: RateLimitConfig;

  constructor(redis: Redis, defaultConfig: RateLimitConfig) {
    this.redis = redis;
    this.defaultConfig = defaultConfig;
  }

  /**
   * Check if message sending is allowed for tenant/channel
   * Uses sliding window log + token bucket for burst handling
   */
  async isAllowed(
    tenantId: string, 
    channel: string, 
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const config = this.getConfigForTenant(tenantId);
    const key = `rate_limit:${tenantId}:${channel}`;
    
    // Different limits based on priority
    const maxRequests = this.getMaxRequestsForPriority(config, priority);
    const burstLimit = config.burstLimit || Math.floor(maxRequests * 1.5);
    
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    try {
      // Use Redis Lua script for atomic operation
      const result = await this.redis.eval(
        this.getRateLimitScript(),
        1,
        key,
        windowStart.toString(),
        now.toString(),
        maxRequests.toString(),
        burstLimit.toString(),
        config.windowMs.toString()
      ) as number[];

      const [allowed, remaining, resetTime] = result;
      
      if (allowed === 1) {
        return {
          allowed: true,
          remaining: remaining,
          resetTime: resetTime
        };
      } else {
        const retryAfter = Math.ceil((resetTime - now) / 1000);
        return {
          allowed: false,
          remaining: 0,
          resetTime: resetTime,
          retryAfter: retryAfter
        };
      }
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        remaining: maxRequests,
        resetTime: now + config.windowMs
      };
    }
  }

  /**
   * Reserve multiple tokens for bulk operations
   */
  async reserveTokens(
    tenantId: string,
    channel: string,
    count: number,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<{
    granted: number;
    remaining: number;
    retryAfter?: number;
  }> {
    const config = this.getConfigForTenant(tenantId);
    const key = `rate_limit:${tenantId}:${channel}`;
    const maxRequests = this.getMaxRequestsForPriority(config, priority);
    
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    try {
      const result = await this.redis.eval(
        this.getBulkReserveScript(),
        1,
        key,
        windowStart.toString(),
        now.toString(),
        maxRequests.toString(),
        count.toString(),
        config.windowMs.toString()
      ) as number[];

      const [granted, remaining, resetTime] = result;
      
      if (granted < count) {
        const retryAfter = Math.ceil((resetTime - now) / 1000);
        return {
          granted: granted,
          remaining: remaining,
          retryAfter: retryAfter
        };
      }

      return {
        granted: granted,
        remaining: remaining
      };
    } catch (error) {
      console.error('Bulk rate limiter error:', error);
      return {
        granted: Math.min(count, maxRequests),
        remaining: Math.max(0, maxRequests - count)
      };
    }
  }

  /**
   * Get current usage stats for tenant/channel
   */
  async getUsageStats(tenantId: string, channel: string): Promise<{
    used: number;
    limit: number;
    remaining: number;
    resetTime: number;
    windowMs: number;
  }> {
    const config = this.getConfigForTenant(tenantId);
    const key = `rate_limit:${tenantId}:${channel}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    try {
      const count = await this.redis.zcount(key, windowStart, now);
      const remaining = Math.max(0, config.maxRequests - count);
      const resetTime = now + config.windowMs;
      
      return {
        used: count,
        limit: config.maxRequests,
        remaining: remaining,
        resetTime: resetTime,
        windowMs: config.windowMs
      };
    } catch (error) {
      console.error('Usage stats error:', error);
      return {
        used: 0,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
        windowMs: config.windowMs
      };
    }
  }

  /**
   * Reset rate limit for tenant (admin function)
   */
  async resetLimit(tenantId: string, channel: string): Promise<void> {
    const key = `rate_limit:${tenantId}:${channel}`;
    await this.redis.del(key);
  }

  /**
   * Get configuration for specific tenant with overrides
   */
  private getConfigForTenant(tenantId: string): RateLimitConfig {
    if (this.defaultConfig.tenantOverrides?.[tenantId]) {
      return {
        ...this.defaultConfig,
        ...this.defaultConfig.tenantOverrides[tenantId]
      };
    }
    return this.defaultConfig;
  }

  /**
   * Adjust max requests based on message priority
   */
  private getMaxRequestsForPriority(
    config: RateLimitConfig,
    priority: 'low' | 'normal' | 'high' | 'urgent'
  ): number {
    switch (priority) {
      case 'urgent':
        return Math.floor(config.maxRequests * 2); // Double limit for urgent
      case 'high':
        return Math.floor(config.maxRequests * 1.5);
      case 'normal':
        return config.maxRequests;
      case 'low':
        return Math.floor(config.maxRequests * 0.5);
      default:
        return config.maxRequests;
    }
  }

  /**
   * Lua script for atomic rate limit check and increment
   */
  private getRateLimitScript(): string {
    return `
      local key = KEYS[1]
      local window_start = tonumber(ARGV[1])
      local now = tonumber(ARGV[2])
      local max_requests = tonumber(ARGV[3])
      local burst_limit = tonumber(ARGV[4])
      local window_ms = tonumber(ARGV[5])
      
      -- Remove old entries outside the window
      redis.call('ZREMRANGEBYSCORE', key, 0, window_start)
      
      -- Count current requests in window
      local current_count = redis.call('ZCARD', key)
      
      -- Check if we can allow this request
      local limit_to_check = math.min(burst_limit, max_requests)
      if current_count < limit_to_check then
        -- Add this request
        redis.call('ZADD', key, now, now .. ':' .. math.random(1000000))
        redis.call('EXPIRE', key, math.ceil(window_ms / 1000))
        
        local remaining = limit_to_check - current_count - 1
        local reset_time = now + window_ms
        
        return {1, remaining, reset_time}
      else
        -- Rate limit exceeded
        local reset_time = now + window_ms
        return {0, 0, reset_time}
      end
    `;
  }

  /**
   * Lua script for bulk token reservation
   */
  private getBulkReserveScript(): string {
    return `
      local key = KEYS[1]
      local window_start = tonumber(ARGV[1])
      local now = tonumber(ARGV[2])
      local max_requests = tonumber(ARGV[3])
      local requested_count = tonumber(ARGV[4])
      local window_ms = tonumber(ARGV[5])
      
      -- Remove old entries
      redis.call('ZREMRANGEBYSCORE', key, 0, window_start)
      
      -- Count current requests
      local current_count = redis.call('ZCARD', key)
      local available = max_requests - current_count
      local granted = math.min(available, requested_count)
      
      -- Add granted tokens
      for i = 1, granted do
        redis.call('ZADD', key, now, now .. ':' .. i .. ':' .. math.random(1000000))
      end
      
      if granted > 0 then
        redis.call('EXPIRE', key, math.ceil(window_ms / 1000))
      end
      
      local remaining = max_requests - current_count - granted
      local reset_time = now + window_ms
      
      return {granted, remaining, reset_time}
    `;
  }
}

/**
 * Factory function to create rate limiter instance
 */
export function createMessageRateLimiter(
  redisConfig: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  },
  rateLimitConfig?: Partial<RateLimitConfig>
): MessageRateLimiter {
  const redis = new Redis({
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password,
    db: redisConfig.db || 0,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true
  });

  const defaultConfig: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 messages per minute
    burstLimit: 90, // Allow burst up to 90
    ...rateLimitConfig
  };

  return new MessageRateLimiter(redis, defaultConfig);
}

/**
 * Express middleware for API rate limiting
 */
export function createRateLimitMiddleware(rateLimiter: MessageRateLimiter) {
  return async (req: any, res: any, next: any) => {
    if (!req.tenant?.salonId) {
      return next();
    }

    const tenantId = req.tenant.salonId;
    const channel = req.body?.channel || 'api';
    const priority = req.body?.priority || 'normal';

    try {
      const result = await rateLimiter.isAllowed(tenantId, channel, priority);

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': result.remaining + (result.allowed ? 1 : 0),
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
      });

      if (!result.allowed) {
        if (result.retryAfter) {
          res.set('Retry-After', result.retryAfter.toString());
        }
        
        return res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: result.retryAfter,
          resetTime: result.resetTime
        });
      }

      next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // Fail open
      next();
    }
  };
}
