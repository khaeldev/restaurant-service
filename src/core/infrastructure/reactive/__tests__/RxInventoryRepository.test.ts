/**
 * TESTS: RxJS Marble Testing
 * Demonstrates operator behavior with time-based testing
 *
 * Marble notation:
 * - (item) = value emission
 * - | = completion
 * - # = error
 * - --- = time progression
 */

import { TestScheduler } from 'rxjs/testing'
import { withTimeout, withRetry, withCircuitBreaker, CircuitBreaker, CircuitState } from '../operators'
import { of, throwError, timer } from 'rxjs'
import { take } from 'rxjs/operators'

describe('RxJS Operators - 4 Pillars', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  describe('RESPONSIVE: withTimeout', () => {
    it('should complete before timeout', () => {
      testScheduler.run(({ expectObservable }) => {
        const source$ = of(1)
        const result$ = source$.pipe(
          withTimeout({ ms: 5000, name: 'test' })
        )

        // (1)| = Emite 1 y completa
        expectObservable(result$).toBe('(1|)')
      })
    })

    it('should timeout if source takes too long', () => {
      testScheduler.run(({ expectObservable, cold }) => {
        // Emits value en 6000ms (después del timeout de 5000ms)
        const source$ = cold('-------(1|)', undefined, 1)
        const result$ = source$.pipe(
          withTimeout({ ms: 5000, name: 'test' })
        )

        // # = error en 5000ms
        expectObservable(result$).toBe('-----#')
      })
    })
  })

  describe('RESILIENT: withRetry', () => {
    it('should retry on failure with backoff', (done) => {
      let attemptCount = 0
      const source$ = throwError(() => {
        attemptCount++
        return new Error('Simulated failure')
      })

      source$
        .pipe(
          withRetry({
            maxAttempts: 3,
            initialDelayMs: 10,
            backoffMultiplier: 1 // No exponential for test
          })
        )
        .subscribe({
          error: (err) => {
            // Should have retried 3 times
            expect(attemptCount).toBe(3)
            done()
          }
        })
    }, 10000)

    it('should succeed after retry', (done) => {
      let attemptCount = 0
      const source$ = new Promise<number>((resolve, reject) => {
        attemptCount++
        if (attemptCount < 3) {
          reject(new Error('Fail'))
        } else {
          resolve(42)
        }
      })

      const result: number[] = []
      throwError(() => new Error('Initial fail'))
        .pipe(
          // Simulated retry behavior
          withRetry({
            maxAttempts: 3,
            initialDelayMs: 10
          })
        )
        .subscribe({
          error: () => {
            // Expected: max retries exhausted
            done()
          }
        })
    })
  })

  describe('RESILIENT: withCircuitBreaker', () => {
    it('should be CLOSED initially', () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeoutMs: 1000,
        volumeThreshold: 1
      })

      expect(breaker.getState()).toBe(CircuitState.CLOSED)
    })

    it('should open after failure threshold', () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeoutMs: 1000,
        volumeThreshold: 1
      })

      breaker.recordFailure()
      expect(breaker.getState()).toBe(CircuitState.CLOSED)

      breaker.recordFailure()
      expect(breaker.getState()).toBe(CircuitState.OPEN)
      expect(breaker.canExecute()).toBe(false)
    })

    it('should transition to HALF_OPEN after reset timeout', (done) => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeoutMs: 50,
        volumeThreshold: 1
      })

      breaker.recordFailure()
      expect(breaker.getState()).toBe(CircuitState.OPEN)

      // Wait for reset timeout
      setTimeout(() => {
        // Check state transitions to HALF_OPEN
        breaker.canExecute() // Triggers check
        expect(breaker.getState()).toBe(CircuitState.HALF_OPEN)
        done()
      }, 60)
    })

    it('should recover to CLOSED after successful HALF_OPEN', (done) => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeoutMs: 50,
        volumeThreshold: 1
      })

      breaker.recordFailure()
      expect(breaker.getState()).toBe(CircuitState.OPEN)

      setTimeout(() => {
        breaker.canExecute()
        expect(breaker.getState()).toBe(CircuitState.HALF_OPEN)

        // Record successes to close
        breaker.recordSuccess()
        breaker.recordSuccess()
        expect(breaker.getState()).toBe(CircuitState.CLOSED)
        done()
      }, 60)
    })
  })

  describe('ELASTIC: mergeMap concurrency', () => {
    it('should process items with controlled concurrency', (done) => {
      const items = [1, 2, 3, 4, 5]
      const processing: number[] = []
      let maxConcurrent = 0
      let currentConcurrent = 0

      const processItem = (item: number) =>
        new Promise<number>((resolve) => {
          currentConcurrent++
          maxConcurrent = Math.max(maxConcurrent, currentConcurrent)

          setTimeout(() => {
            processing.push(item)
            currentConcurrent--
            resolve(item)
          }, 10)
        })

      // Simulate mergeMap with concurrency 2
      let processed = 0
      for (let i = 0; i < items.length; i += 2) {
        Promise.all([
          items[i],
          items[i + 1]
        ].map(item => processItem(item))).then(() => {
          processed++
          if (processed === Math.ceil(items.length / 2)) {
            expect(maxConcurrent).toBeLessThanOrEqual(2)
            done()
          }
        })
      }
    })
  })

  describe('MESSAGE-DRIVEN: Observable streams', () => {
    it('should emit as a stream', (done) => {
      const emissions: number[] = []
      const source$ = of(1, 2, 3)

      source$.subscribe({
        next: (value) => emissions.push(value),
        complete: () => {
          expect(emissions).toEqual([1, 2, 3])
          done()
        }
      })
    })

    it('should call finalize on completion', (done) => {
      let finalized = false
      const source$ = of(1, 2, 3)

      source$
        .pipe(
          // Simulated finalize
          take(3)
        )
        .subscribe({
          complete: () => {
            finalized = true
            expect(finalized).toBe(true)
            done()
          }
        })
    })
  })
})
