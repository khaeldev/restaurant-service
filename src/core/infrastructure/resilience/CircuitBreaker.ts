/**
 * Circuit Breaker pattern implementation.
 * States: CLOSED → OPEN → HALF_OPEN → CLOSED
 *
 * - CLOSED: normal operation, failures are counted
 * - OPEN: failing fast, throwing CircuitOpenError after failureThreshold failures
 * - HALF_OPEN: testing if service recovered, moves to CLOSED on halfOpenSuccessThreshold successes
 */

import { CircuitOpenError } from './ResilienceErrors'
import { logger } from '@powertools/utilities'

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export interface CircuitBreakerConfig {
  failureThreshold: number
  resetTimeout: number
  halfOpenSuccessThreshold: number
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED'
  private failureCount = 0
  private successCount = 0
  private openedAt: number | null = null

  constructor(
    private readonly name: string,
    private readonly config: CircuitBreakerConfig
  ) {}

  /**
   * Execute an async operation with circuit breaker protection.
   * Throws CircuitOpenError if circuit is OPEN.
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.transitionIfNeeded()

    if (this.state === 'OPEN') {
      const retryAfterMs = this.openedAt !== null
        ? Math.max(0, this.config.resetTimeout - (Date.now() - this.openedAt))
        : this.config.resetTimeout
      throw new CircuitOpenError(this.name, retryAfterMs)
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  getState(): CircuitState {
    this.transitionIfNeeded()
    return this.state
  }

  // --- private helpers ---

  private transitionIfNeeded(): void {
    if (this.state === 'OPEN' && this.openedAt !== null) {
      const elapsed = Date.now() - this.openedAt
      if (elapsed >= this.config.resetTimeout) {
        this.transitionTo('HALF_OPEN')
      }
    }
  }

  private onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.successCount++
      if (this.successCount >= this.config.halfOpenSuccessThreshold) {
        this.transitionTo('CLOSED')
      }
    } else if (this.state === 'CLOSED') {
      // CLOSED: reset failure count on any success
      this.failureCount = 0
    }
  }

  private onFailure(): void {
    if (this.state === 'HALF_OPEN') {
      // Any failure in HALF_OPEN immediately re-opens
      this.transitionTo('OPEN')
    } else if (this.state === 'CLOSED') {
      this.failureCount++
      if (this.failureCount >= this.config.failureThreshold) {
        this.transitionTo('OPEN')
      }
    }
  }

  private transitionTo(newState: CircuitState): void {
    const previous = this.state
    this.state = newState
    this.failureCount = 0
    this.successCount = 0

    if (newState === 'OPEN') {
      this.openedAt = Date.now()
    }

    logger.info('CircuitBreaker state transition', {
      breaker: this.name,
      from: previous,
      to: newState
    })
  }
}
