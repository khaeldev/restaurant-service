import { SQSEvent, SQSHandler } from 'aws-lambda'
import { PrepareDishUsecase } from '@core/app/usecases/PrepareDishUsecase'
import { DynamoDishRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoDishRepository'
import { DynamoWarehouseRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoWarehouseRepository'
import { DynamoOrderRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoOrderRepository'
import { EventBridgePublisher } from '@core/infrastructure/repositories/events/EventBridgePublisher'
import { logger } from '@powertools/utilities'

// Composition Root
const dishRepository = new DynamoDishRepository()
const warehouseRepository = new DynamoWarehouseRepository()
const orderRepository = new DynamoOrderRepository()
const eventPublisher = new EventBridgePublisher()
const prepareDishUsecase = new PrepareDishUsecase(
  dishRepository,
  warehouseRepository,
  orderRepository,
  eventPublisher
)

export const handler: SQSHandler = async (event: SQSEvent) => {
  const promises = event.Records.map(async (record) => {
    try {
      logger.info('kitchenPreparationWorker: processing IngredientsProcured event', { messageId: record.messageId })

      // Parse the SQS message body (which contains EventBridge event)
      const ingredientsProcuredEvent = JSON.parse(record.body).detail

      await prepareDishUsecase.execute(ingredientsProcuredEvent)

      logger.info('kitchenPreparationWorker: dish prepared successfully', { messageId: record.messageId })
    } catch (error) {
      logger.error('kitchenPreparationWorker: failed to prepare dish', { error, messageId: record.messageId })
      throw error
    }
  })

  await Promise.all(promises)
}
