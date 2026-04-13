/**
 * RESPONSIVE Pillar: Predicts response times with timeouts
 * Ensures the system responds within a bounded time period
 */

import { Observable, timeout, TimeoutError } from 'rxjs'
import { catchError } from 'rxjs/operators'

export interface TimeoutConfig {
  ms: number
  name: string
}

/**
 * Applies a timeout to an observable
 * If the source doesn't emit within ms, it errors with TimeoutError
 */
export const withTimeout = (config: TimeoutConfig) => <T,>(source: Observable<T>): Observable<T> => {
  return source.pipe(
    timeout(config.ms),
    catchError(error => {
      if (error instanceof TimeoutError) {
        throw new Error(`[RESPONSIVE] ${config.name} exceeded ${config.ms}ms timeout`)
      }
      throw error
    })
  )
}
