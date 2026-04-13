/**
 * RESILIENT Pillar: Handles failures gracefully with retry and backoff
 * Exponential backoff with jitter to avoid thundering herd
 */

import { Observable } from 'rxjs'
import { retry } from 'rxjs/operators'

export interface RetryConfig {
  maxAttempts: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2
}

/**
 * Retries with exponential backoff + jitter
 * Jitter = randomized delay to prevent synchronized retries
 */
export const withRetry = (config: Partial<RetryConfig> = {}) => <T,>(source: Observable<T>): Observable<T> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  return source.pipe(
    retry({
      count: finalConfig.maxAttempts - 1,
      delay: (error, attemptNumber) => {
        const exponentialDelay = finalConfig.initialDelayMs * Math.pow(finalConfig.backoffMultiplier, attemptNumber - 1)
        const cappedDelay = Math.min(exponentialDelay, finalConfig.maxDelayMs)
        const jitter = cappedDelay * Math.random()
        const totalDelay = cappedDelay + jitter

        console.log(
          `[RESILIENT] Retry attempt ${attemptNumber}/${finalConfig.maxAttempts} after ${Math.round(totalDelay)}ms`,
          error.message
        )

        return new Observable(subscriber => {
          setTimeout(() => subscriber.complete(), totalDelay)
        })
      }
    })
  )
}
