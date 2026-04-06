/**
 * Sliding Window Rate Limiter using fixed time window.
 * Maintains a rolling window of request timestamps.
 *
 * Lambda note: This is per-instance rate limiting.
 * Warm invocations share state within an instance;
 * for global rate limiting across instances, DynamoDB would be needed.
 */

import { RateLimitExceededError } from './ResilienceErrors'

export interface RateLimiterConfig {
  windowMs: number
  maxRequests: number
}

export class SlidingWindowRateLimiter {
  private timestamps: number[] = []

  constructor(private readonly config: RateLimiterConfig) {}

  /**
   * Check if a new request is allowed within the rate limit.
   * Throws RateLimitExceededError if the limit is exceeded.
   * Returns the number of remaining requests in the current window.
   */
  check(): number {
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    // Remove expired timestamps (older than window)
    let i = 0
    while (i < this.timestamps.length && (this.timestamps[i] ?? 0) <= windowStart) {
      i++
    }
    if (i > 0) {
      this.timestamps = this.timestamps.slice(i)
    }

    // Check if limit is exceeded
    if (this.timestamps.length >= this.config.maxRequests) {
      throw new RateLimitExceededError(this.config.windowMs, this.config.maxRequests)
    }

    // Add current request timestamp
    this.timestamps.push(now)
    return this.config.maxRequests - this.timestamps.length
  }

  /**
   * Peek at how many requests remain in the current window
   * without consuming one.
   */
  peek(): number {
    const now = Date.now()
    const windowStart = now - this.config.windowMs
    const active = this.timestamps.filter(t => t > windowStart)
    return Math.max(0, this.config.maxRequests - active.length)
  }
}
