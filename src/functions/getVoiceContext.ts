import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda'
import { GetVoiceContextController } from '@core/infrastructure/adapters/in/http/GetVoiceContextController'
import { GetVoiceContextUsecase } from '@core/app/usecases/GetVoiceContextUsecase'
import { DynamoOrderRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoOrderRepository'
import { DynamoRecipeRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoRecipeRepository'
import { DynamoWarehouseRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoWarehouseRepository'
import { logger, responseHandler } from '@powertools/utilities'

const orderRepository = new DynamoOrderRepository()
const recipeRepository = new DynamoRecipeRepository()
const warehouseRepository = new DynamoWarehouseRepository()

const usecase = new GetVoiceContextUsecase(orderRepository, recipeRepository, warehouseRepository)
const controller = new GetVoiceContextController(usecase)

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    logger.info('getVoiceContext handler invoked', { requestId: event.requestContext?.requestId })

    const result = await controller.execute(event)

    return responseHandler(200, result)
  } catch (error) {
    logger.error('getVoiceContext handler failed', { error })
    return responseHandler(500, null, error)
  }
}
