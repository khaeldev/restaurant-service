import { SQSEvent, SQSHandler } from 'aws-lambda'
import { ProcureIngredientsUsecase } from '@core/app/usecases/ProcureIngredientsUsecase'
import { DynamoWarehouseRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoWarehouseRepository'
import { DynamoPurchaseRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoPurchaseRepository'
import { FarmersMarketClient } from '@core/infrastructure/repositories/clients/FarmersMarketClient'
import { EventBridgePublisher } from '@core/infrastructure/repositories/events/EventBridgePublisher'
import { logger } from '@powertools/utilities'
import { CircuitBreaker, Bulkhead } from '@core/infrastructure/resilience'

// Resilience singletons (persist across warm invocations)
const farmersMarketCircuitBreaker = new CircuitBreaker('FarmersMarketClient', {
  failureThreshold: 3,
  resetTimeout: 10_000,
  halfOpenSuccessThreshold: 2
})
const farmersMarketBulkhead = new Bulkhead('FarmersMarketClient', {
  maxConcurrent: 5,
  maxQueueSize: 10,
  timeoutMs: 8_000
})

// Composition Root
const warehouseRepository = new DynamoWarehouseRepository()
const purchaseRepository = new DynamoPurchaseRepository()
const farmersMarketClient = new FarmersMarketClient(farmersMarketCircuitBreaker, farmersMarketBulkhead)
const eventPublisher = new EventBridgePublisher()
const procureIngredientsUsecase = new ProcureIngredientsUsecase(
  warehouseRepository,
  purchaseRepository,
  farmersMarketClient,
  eventPublisher
)

export const handler: SQSHandler = async (event: SQSEvent) => {
  const promises = event.Records.map(async (record) => {
    try {
      logger.info('warehouseWorker: processing IngredientsRequested event', { messageId: record.messageId })

      // Parse the SQS message body (which contains EventBridge event)
      const ingredientsRequestedEvent = JSON.parse(record.body).detail

      await procureIngredientsUsecase.execute(ingredientsRequestedEvent)

      logger.info('warehouseWorker: ingredients procured successfully', { messageId: record.messageId })
    } catch (error) {
      logger.error('warehouseWorker: failed to procure ingredients', { error, messageId: record.messageId })
      throw error
    }
  })

  await Promise.all(promises)
}
