/**
 * REACTIVE VERSION: GetInventoryControllerRx
 * Demonstrates message-driven, functional error handling
 */

import { APIGatewayProxyEvent } from 'aws-lambda'
import { RxInventoryRepository } from '@core/infrastructure/reactive'
import { Observable } from 'rxjs'
import { map, catchError } from 'rxjs/operators'
import { logger } from '@powertools/utilities'
import { throwError } from 'rxjs'

interface InventoryResponse {
  inventory: Array<{
    ingredientName: string
    availableQuantity: number
    reservedQuantity: number
    updatedAt: string
  }>
}

export class GetInventoryControllerRx {
  constructor(private readonly rxRepository: RxInventoryRepository) {}

  /**
   * Returns an Observable stream instead of a Promise
   * Caller can:
   * - .toPromise() → Convert to Promise (for Lambda)
   * - .subscribe() → Subscribe directly (for streams)
   * - .pipe() → Chain more operators
   */
  execute(_event: APIGatewayProxyEvent): Observable<InventoryResponse> {
    logger.info('GetInventoryControllerRx: fetching inventory stream')

    // MESSAGE-DRIVEN: Observable stream of inventory
    return this.rxRepository.getAllInventorySimple$().pipe(
      // Transform inventory items to response format (functional)
      map(inventory => ({
        inventory: inventory.map(item => ({
          ingredientName: item.ingredientName,
          availableQuantity: item.availableQuantity,
          reservedQuantity: item.reservedQuantity,
          updatedAt: item.updatedAt
        }))
      })),

      map(response => {
        logger.info('GetInventoryControllerRx: inventory fetched', {
          count: response.inventory.length
        })
        return response
      }),

      catchError(error => {
        logger.error('GetInventoryControllerRx: error', {
          error: error instanceof Error ? error.message : String(error)
        })
        return throwError(() => error)
      })
    )
  }
}
