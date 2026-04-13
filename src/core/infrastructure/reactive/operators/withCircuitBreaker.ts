/**
 * RESILIENT Pillar: Circuit Breaker as Observable
 * Prevents cascading failures by stopping requests when threshold is exceeded
 */

import { Observable, throwError } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN' // Testing recovery
}

export interface CircuitBreakerConfig {
  failureThreshold: number // Failures before opening
  resetTimeoutMs: number // Time before attempting recovery
  volumeThreshold: number // Min requests before evaluating
  halfOpenSuccessThreshold?: number 
}

export class CircuitBreaker {
  private state = CircuitState.CLOSED
  private failureCount = 0
  private successCount = 0
  private lastFailureTime?: number
  private totalRequests = 0

  constructor(private config: CircuitBreakerConfig) {}

  getState(): CircuitState {
    return this.state
  }

  private checkHalfOpenTimeout() {
    if (this.state === CircuitState.OPEN) {
      const now = Date.now()
      if (this.lastFailureTime && now - this.lastFailureTime > this.config.resetTimeoutMs) {
        console.log('[RESILIENT] Circuit breaker transitioning to HALF_OPEN')
        this.state = CircuitState.HALF_OPEN
        this.successCount = 0
      }
    }
  }

  canExecute(): boolean {
    this.checkHalfOpenTimeout()
    return this.state !== CircuitState.OPEN
  }

  recordSuccess() {
    this.totalRequests++

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++
      if (this.successCount >= (this.config.halfOpenSuccessThreshold ?? 2)) {
        console.log('[RESILIENT] Circuit breaker CLOSED (recovered)')
        this.state = CircuitState.CLOSED
        this.reset()
      }
    }
  }

  recordFailure() {
    this.lastFailureTime = Date.now()
    this.failureCount++
    this.totalRequests++

    if (
      this.totalRequests >= this.config.volumeThreshold &&
      this.failureCount >= this.config.failureThreshold) {
      console.log(`[RESILIENT] Circuit breaker OPEN (${this.failureCount} failures)`)
      this.state = CircuitState.OPEN
    }
  }
  
  private reset() {
    this.failureCount = 0
    this.totalRequests = 0
    this.successCount = 0
  }
}

/**
 * Circuit Breaker operator for RxJS
 */
export const withCircuitBreaker = (breaker: CircuitBreaker) => <T,>(source: Observable<T>): Observable<T> => {
  return new Observable(subscriber => {
    if (!breaker.canExecute()) {
      subscriber.error(new Error('[RESILIENT] Circuit breaker is OPEN'))
      return
    }

    source
      .pipe(
        tap(() => breaker.recordSuccess()),
        catchError(error => {
          breaker.recordFailure()
          return throwError(() => error)
        })
      )
      .subscribe(subscriber)
  })
}
