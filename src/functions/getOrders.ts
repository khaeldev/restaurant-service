import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda'
import { GetOrdersController } from '@core/infrastructure/adapters/in/http/GetOrdersController'
import { DynamoOrderRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoOrderRepository'
import { logger, responseHandler } from '@powertools/utilities'

// Composition Root
const orderRepository = new DynamoOrderRepository()
const controller = new GetOrdersController(orderRepository)

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    logger.info('getOrders handler invoked', { requestId: event.requestContext?.requestId })

    const result = await controller.execute(event)

    return responseHandler(200, result)
  } catch (error) {
    logger.error('getOrders handler failed', { error })
    return responseHandler(500, null, error)
  }
}
