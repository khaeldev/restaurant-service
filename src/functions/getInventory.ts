import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda'
import { GetInventoryController } from '@core/infrastructure/adapters/in/http/GetInventoryController'
import { DynamoWarehouseRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoWarehouseRepository'
import { logger, responseHandler } from '@powertools/utilities'
import { SlidingWindowRateLimiter } from '@core/infrastructure/resilience'

// Rate limiter (per-instance)
const rateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60_000,
  maxRequests: 100
})

// Composition Root
const warehouseRepository = new DynamoWarehouseRepository()
const controller = new GetInventoryController(warehouseRepository)

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    logger.info('getInventory handler invoked', { requestId: event.requestContext?.requestId })

    rateLimiter.check()
    const result = await controller.execute(event)

    return responseHandler(200, result)
  } catch (error) {
    logger.error('getInventory handler failed', { error })
    return responseHandler(500, null, error)
  }
}
