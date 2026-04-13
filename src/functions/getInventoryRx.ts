/**
 * REACTIVE VERSION: getInventoryRx Handler
 * Demonstrates all 4 pillars:
 * - RESPONSIVE: Timeout at handler level
 * - RESILIENT: Retry + Circuit Breaker from operators
 * - ELASTIC: mergeMap concurrency in repository
 * - MESSAGE-DRIVEN: Observable streams throughout
 */

import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda'
import { GetInventoryControllerRx } from '@core/infrastructure/adapters/in/http/GetInventoryControllerRx'
import { RxInventoryRepository } from '@core/infrastructure/reactive'
import { logger, responseHandler } from '@powertools/utilities'
import { SlidingWindowRateLimiter } from '@core/infrastructure/resilience'
import { timeout } from 'rxjs/operators'

// Rate limiter (per-instance)
const rateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60_000,
  maxRequests: 100
})

// Composition Root (DI)
const rxRepository = new RxInventoryRepository()
const controller = new GetInventoryControllerRx(rxRepository)

/**
 * Handler: Convert Observable to Promise for Lambda
 * Lambda expects: async function → Promise<APIGatewayProxyResultV2>
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    logger.info('getInventoryRx handler invoked', {
      requestId: event.requestContext?.requestId,
      pillars: ['RESPONSIVE', 'RESILIENT', 'ELASTIC', 'MESSAGE-DRIVEN']
    })

    // Rate limiting (same as imperative version)
    rateLimiter.check()

    // Execute controller and add RESPONSIVE timeout at handler level
    // (repository already has timeout, but this is an extra safety net)
    const result = await controller
      .execute(event)
      .pipe(
        // RESPONSIVE: Handler-level timeout (15 seconds)
        timeout(15000)
      )
      .toPromise()

    logger.info('getInventoryRx handler success', { result })
    return responseHandler(200, result)
  } catch (error) {
    logger.error('getInventoryRx handler failed', {
      error: error instanceof Error ? error.message : String(error)
    })
    return responseHandler(500, null, error)
  }
}
