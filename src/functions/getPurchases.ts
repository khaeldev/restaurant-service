import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda'
import { GetPurchasesController } from '@core/infrastructure/adapters/in/http/GetPurchasesController'
import { DynamoPurchaseRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoPurchaseRepository'
import { logger, responseHandler } from '@powertools/utilities'
import { SlidingWindowRateLimiter } from '@core/infrastructure/resilience'

// Rate limiter (per-instance)
const rateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60_000,
  maxRequests: 100
})

// Composition Root
const purchaseRepository = new DynamoPurchaseRepository()
const controller = new GetPurchasesController(purchaseRepository)

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    logger.info('getPurchases handler invoked', { requestId: event.requestContext?.requestId })

    rateLimiter.check()
    const result = await controller.execute(event)

    return responseHandler(200, result)
  } catch (error) {
    logger.error('getPurchases handler failed', { error })
    return responseHandler(500, null, error)
  }
}
