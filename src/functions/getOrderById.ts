import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda'
import { GetOrderByIdController } from '@core/infrastructure/adapters/in/http/GetOrderByIdController'
import { DynamoOrderRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoOrderRepository'
import { DynamoDishRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoDishRepository'
import { logger, responseHandler } from '@powertools/utilities'

// Composition Root
const orderRepository = new DynamoOrderRepository()
const dishRepository = new DynamoDishRepository()
const controller = new GetOrderByIdController(orderRepository, dishRepository)

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    logger.info('getOrderById handler invoked', { requestId: event.requestContext?.requestId })

    const result = await controller.execute(event)

    return responseHandler(200, result)
  } catch (error) {
    logger.error('getOrderById handler failed', { error })
    return responseHandler(500, null, error)
  }
}
