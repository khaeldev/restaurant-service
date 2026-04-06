import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda'
import { ProcessVoiceCommandController } from '@core/infrastructure/adapters/in/http/ProcessVoiceCommandController'
import { ProcessVoiceCommandUsecase } from '@core/app/usecases/ProcessVoiceCommandUsecase'
import { VoiceAIClient } from '@core/infrastructure/repositories/clients/VoiceAIClient'
import { DynamoConversationRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoConversationRepository'
import { DynamoOrderRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoOrderRepository'
import { DynamoRecipeRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoRecipeRepository'
import { DynamoWarehouseRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoWarehouseRepository'
import { EventBridgePublisher } from '@core/infrastructure/repositories/events/EventBridgePublisher'
import { logger, responseHandler } from '@powertools/utilities'

// Composition Root
const voiceAIClient = new VoiceAIClient()
const conversationRepository = new DynamoConversationRepository()
const orderRepository = new DynamoOrderRepository()
const recipeRepository = new DynamoRecipeRepository()
const warehouseRepository = new DynamoWarehouseRepository()
const eventPublisher = new EventBridgePublisher()

const processVoiceCommandUsecase = new ProcessVoiceCommandUsecase(
  voiceAIClient,
  conversationRepository,
  orderRepository,
  recipeRepository,
  warehouseRepository,
  eventPublisher
)

const controller = new ProcessVoiceCommandController(processVoiceCommandUsecase)

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    logger.info('processVoiceCommand handler invoked', { requestId: event.requestContext?.requestId })

    const result = await controller.execute(event)

    return responseHandler(200, result)
  } catch (error) {
    logger.error('processVoiceCommand handler failed', { error })
    return responseHandler(500, null, error)
  }
}
