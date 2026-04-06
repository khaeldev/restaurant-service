import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda'
import { CreateOrderController } from '@core/infrastructure/adapters/in/http/CreateOrderController'
import { DynamoOrderRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoOrderRepository'
import { EventBridgePublisher } from '@core/infrastructure/repositories/events/EventBridgePublisher'
import { CreateOrderUsecase } from '@core/app/usecases/CreateOrderUsecase'
import { logger, responseHandler } from '@powertools/utilities'
import { SlidingWindowRateLimiter } from '@core/infrastructure/resilience'

// Rate limiter (per-instance)
const rateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60_000,
  maxRequests: 50
})

// Composition Root
const orderRepository = new DynamoOrderRepository()
const eventPublisher = new EventBridgePublisher()
const createOrderUsecase = new CreateOrderUsecase(orderRepository, eventPublisher)
const controller = new CreateOrderController(createOrderUsecase)

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    logger.info('createOrder handler invoked', { requestId: event.requestContext?.requestId })

    rateLimiter.check()
    const result = await controller.execute(event)

    return responseHandler(201, result)
  } catch (error) {
    logger.error('createOrder handler failed', { error })
    return responseHandler(500, null, error)
  }
}
