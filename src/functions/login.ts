import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda'
import { LoginController } from '@core/infrastructure/adapters/in/http/LoginController'
import { LoginUsecase } from '@core/app/usecases/LoginUsecase'
import { DynamoUserRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoUserRepository'
import { JWTServiceImpl } from '@core/infrastructure/repositories/services/JWTServiceImpl'
import { logger, responseHandler } from '@powertools/utilities'

// Composition Root
const userRepository = new DynamoUserRepository()
const jwtService = new JWTServiceImpl()
const loginUsecase = new LoginUsecase(userRepository, jwtService)
const controller = new LoginController(loginUsecase)

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    logger.info('login handler invoked', { requestId: event.requestContext?.requestId })

    const result = await controller.execute(event)

    return responseHandler(200, result)
  } catch (error) {
    logger.error('login handler failed', { error })
    return responseHandler(401, null, error)
  }
}
