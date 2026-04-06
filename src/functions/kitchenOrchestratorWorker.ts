import { SQSEvent, SQSHandler } from 'aws-lambda'
import { SelectRecipesUsecase } from '@core/app/usecases/SelectRecipesUsecase'
import { DynamoDishRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoDishRepository'
import { DynamoRecipeRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoRecipeRepository'
import { DynamoOrderRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoOrderRepository'
import { EventBridgePublisher } from '@core/infrastructure/repositories/events/EventBridgePublisher'
import { logger } from '@powertools/utilities'

// Composition Root
const dishRepository = new DynamoDishRepository()
const recipeRepository = new DynamoRecipeRepository()
const orderRepository = new DynamoOrderRepository()
const eventPublisher = new EventBridgePublisher()
const selectRecipesUsecase = new SelectRecipesUsecase(
  dishRepository,
  recipeRepository,
  orderRepository,
  eventPublisher
)

export const handler: SQSHandler = async (event: SQSEvent) => {
  const promises = event.Records.map(async (record) => {
    try {
      logger.info('kitchenOrchestratorWorker: processing OrderCreated event', { messageId: record.messageId })

      // Parse the SQS message body (which contains EventBridge event)
      const orderCreatedEvent = JSON.parse(record.body).detail

      await selectRecipesUsecase.execute(orderCreatedEvent)

      logger.info('kitchenOrchestratorWorker: order processed successfully', { messageId: record.messageId })
    } catch (error) {
      logger.error('kitchenOrchestratorWorker: failed to process order', { error, messageId: record.messageId })
      throw error
    }
  })

  await Promise.all(promises)
}
