/**
 * Custom error classes for resilience patterns.
 * Each error carries a statusCode for HTTP response mapping.
 */

export class CircuitOpenError extends Error {
  readonly name = 'CircuitOpenError'
  readonly statusCode = 503

  constructor(
    public readonly clientName: string,
    public readonly retryAfterMs: number
  ) {
    super(`Circuit breaker is OPEN for ${clientName}. Retry after ${retryAfterMs}ms.`)
  }
}

export class RateLimitExceededError extends Error {
  readonly name = 'RateLimitExceededError'
  readonly statusCode = 429

  constructor(
    public readonly windowMs: number,
    public readonly maxRequests: number
  ) {
    super(`Rate limit exceeded: max ${maxRequests} requests per ${windowMs}ms window.`)
  }
}

export class BulkheadFullError extends Error {
  readonly name = 'BulkheadFullError'
  readonly statusCode = 503

  constructor(
    public readonly resourceName: string,
    public readonly maxConcurrent: number,
    public readonly maxQueueSize: number
  ) {
    super(
      `Bulkhead full for ${resourceName}: ` +
      `${maxConcurrent} concurrent slots and ${maxQueueSize} queue slots are all occupied.`
    )
  }
}
