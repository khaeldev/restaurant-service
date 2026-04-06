import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda'
import { GetConversationHistoryController } from '@core/infrastructure/adapters/in/http/GetConversationHistoryController'
import { GetConversationHistoryUsecase } from '@core/app/usecases/GetConversationHistoryUsecase'
import { DynamoConversationRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoConversationRepository'
import { logger, responseHandler } from '@powertools/utilities'
import { SlidingWindowRateLimiter } from '@core/infrastructure/resilience'

// Rate limiter (per-instance)
const rateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60_000,
  maxRequests: 100
})

const conversationRepository = new DynamoConversationRepository()
const usecase = new GetConversationHistoryUsecase(conversationRepository)
const controller = new GetConversationHistoryController(usecase)

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    logger.info('getConversationHistory handler invoked', { requestId: event.requestContext?.requestId })

    rateLimiter.check()
    const result = await controller.execute(event)

    return responseHandler(200, result)
  } catch (error) {
    logger.error('getConversationHistory handler failed', { error })
    return responseHandler(500, null, error)
  }
}
