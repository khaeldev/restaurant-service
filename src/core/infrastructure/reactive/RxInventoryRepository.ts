/**
 * REACTIVE & FUNCTIONAL: Reactive version of WarehouseRepository
 * Demonstrates all 4 pillars:
 * - RESPONSIVE: timeout operator with predefined ms
 * - RESILIENT: retry with backoff + circuit breaker
 * - ELASTIC: mergeMap for concurrent item processing
 * - MESSAGE-DRIVEN: Observable streams as messages
 */

import { Observable, from, throwError } from 'rxjs'
import { mergeMap, tap, catchError, finalize } from 'rxjs/operators'
import { DynamoWarehouseRepository } from '../repositories/DynamoDB/DynamoWarehouseRepository'
import { WarehouseInventory } from '../../domain/aggregates/WarehouseInventory'
import { withTimeout, withRetry, withCircuitBreaker, CircuitBreaker } from './operators'
import { logger } from '@powertools/utilities'

export class RxInventoryRepository {
  private readonly imperativeRepo: DynamoWarehouseRepository
  private readonly circuitBreaker: CircuitBreaker

  constructor() {
    this.imperativeRepo = new DynamoWarehouseRepository()
    // Configuration: open after 5 failures, reset after 10s
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeoutMs: 10000,
      volumeThreshold: 10
    })
  }

  /**
   * ELASTIC + MESSAGE-DRIVEN + RESILIENT + RESPONSIVE
   * Fetches all inventory items as an Observable stream
   *
   * Flow:
   * 1. from() → Creates observable from promise (MESSAGE-DRIVEN)
   * 2. mergeMap() → Processes items concurrently (ELASTIC - max 3 parallel)
   * 3. withCircuitBreaker → Stops on repeated failures (RESILIENT)
   * 4. withRetry() → Retries with exponential backoff (RESILIENT)
   * 5. withTimeout() → Bounds response time (RESPONSIVE)
   * 6. tap() → Side effects (logging)
   * 7. catchError() → Functional error handling
   * 8. finalize() → Cleanup
   */
  getAllInventory$(): Observable<WarehouseInventory[]> {
    return from(this.imperativeRepo.getAllInventory()).pipe(
      // TAP: Log start
      tap(items => {
        logger.info('[ELASTIC] Starting to process inventory items', {
          count: items.length,
          circuitBreakerState: this.circuitBreaker.getState()
        })
      }),

      // ELASTIC: Process items in parallel (mergeMap with concurrency 3)
      // Each item goes through the pipeline independently
      mergeMap(
        items =>
          from(items).pipe(
            mergeMap(
              item =>
                // For each item, emit it after enrichment
                from([item]).pipe(
                  // RESILIENT: Apply circuit breaker
                  source => withCircuitBreaker(this.circuitBreaker)(source),

                  // RESILIENT: Apply retry with backoff
                  withRetry({
                    maxAttempts: 3,
                    initialDelayMs: 100,
                    backoffMultiplier: 2
                  }),

                  // RESPONSIVE: Apply timeout (5 seconds per item)
                  withTimeout({
                    ms: 5000,
                    name: `Inventory item ${item.ingredientName}`
                  }),

                  // TAP: Side effect logging
                  tap(processedItem => {
                    logger.info('[ELASTIC] Item processed', {
                      ingredientName: processedItem.ingredientName,
                      available: processedItem.availableQuantity
                    })
                  })
                ),
              3 // ELASTIC: Max 3 concurrent items
            ),
            // Collect all processed items back into array
            (processed: Observable<WarehouseInventory>) =>
              new Observable<WarehouseInventory[]>(subscriber => {
                const collected: WarehouseInventory[] = []
                processed.subscribe({
                  next: item => collected.push(item),
                  error: err => subscriber.error(err),
                  complete: () => subscriber.next(collected)
                })
              })
          ),
        1 // Single batch
      ),

      // FINALIZE: Cleanup (runs on complete or error)
      finalize(() => {
        logger.info('[MESSAGE-DRIVEN] Inventory stream closed', {
          circuitBreakerState: this.circuitBreaker.getState()
        })
      }),

      // Error handling (functional, no try/catch)
      catchError(error => {
        logger.error('[RESILIENT] getAllInventory$ failed', {
          error: error instanceof Error ? error.message : String(error),
          circuitBreakerState: this.circuitBreaker.getState()
        })
        return throwError(() => error)
      })
    )
  }

  /**
   * Simplified version: Just fetch with 4 pillars, no processing
   * Cleaner demonstration of the operators
   */
  getAllInventorySimple$(): Observable<WarehouseInventory[]> {
    return from(this.imperativeRepo.getAllInventory()).pipe(
      withCircuitBreaker(this.circuitBreaker),
      withRetry({ maxAttempts: 3, initialDelayMs: 100 }),
      withTimeout({ ms: 10000, name: 'getAllInventory' }),
      tap(items => logger.info('[RESPONSIVE] Inventory fetched', { count: items.length })),
      catchError(error => {
        logger.error('[RESILIENT] Fallback: returning empty inventory', { error: String(error) })
        return from([[]])
      })
    )
  }
}
