/**
 * Bulkhead pattern implementation using a semaphore-based concurrency limiter.
 * Prevents resource exhaustion by limiting concurrent operations.
 *
 * When all slots are occupied:
 * - New requests are queued (up to maxQueueSize)
 * - Exceeding maxQueueSize throws BulkheadFullError
 * - Each queued request has a timeout after which it rejects
 */

import { BulkheadFullError } from './ResilienceErrors'
import { logger } from '@powertools/utilities'

export interface BulkheadConfig {
  maxConcurrent: number
  maxQueueSize: number
  timeoutMs: number
}

interface QueueEntry {
  resolve: () => void
  reject: (err: Error) => void
  timer: ReturnType<typeof setTimeout>
}

export class Bulkhead {
  private activeCount = 0
  private readonly queue: QueueEntry[] = []

  constructor(
    private readonly name: string,
    private readonly config: BulkheadConfig
  ) {}

  /**
   * Execute an async operation within the bulkhead.
   * Acquires a slot before execution; releases after completion.
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    await this.acquireSlot()
    try {
      return await operation()
    } finally {
      this.releaseSlot()
    }
  }

  getActiveCount(): number {
    return this.activeCount
  }

  getQueueDepth(): number {
    return this.queue.length
  }

  // --- private helpers ---

  private acquireSlot(): Promise<void> {
    // If there are available slots, use one immediately
    if (this.activeCount < this.config.maxConcurrent) {
      this.activeCount++
      return Promise.resolve()
    }

    // If queue is full, reject immediately
    if (this.queue.length >= this.config.maxQueueSize) {
      logger.warn('Bulkhead full', {
        bulkhead: this.name,
        activeCount: this.activeCount,
        queueDepth: this.queue.length
      })
      return Promise.reject(
        new BulkheadFullError(this.name, this.config.maxConcurrent, this.config.maxQueueSize)
      )
    }

    // Queue the request
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        // Remove from queue if still there
        const idx = this.queue.findIndex(e => e.timer === timer)
        if (idx !== -1) {
          this.queue.splice(idx, 1)
        }
        reject(
          new Error(
            `Bulkhead ${this.name}: request timed out waiting for a slot after ${this.config.timeoutMs}ms`
          )
        )
      }, this.config.timeoutMs)

      this.queue.push({ resolve, reject, timer })
    })
  }

  private releaseSlot(): void {
    const next = this.queue.shift()
    if (next) {
      // Grant the slot directly to the next queued request
      clearTimeout(next.timer)
      next.resolve()
      // activeCount stays the same; the next request now "occupies" the slot
    } else {
      // No queued requests, decrement active count
      this.activeCount--
    }
  }
}
