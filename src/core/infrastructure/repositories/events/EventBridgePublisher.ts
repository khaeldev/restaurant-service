import { PutEventsCommand } from '@aws-sdk/client-eventbridge'
import { getClientEventBridge } from '../EventBridge/Client'
import { config } from '@config/environment'
import { IEventPublisher, EventDetail } from '@core/app/ports/out/events/IEventPublisher'
import { logger } from '@powertools/utilities'

export class EventBridgePublisher implements IEventPublisher {
  private readonly eventBusName: string

  constructor() {
    this.eventBusName = config.serviceEventBus || 'restaurant-service-dev'
  }

  async publishEvent(source: string, detailType: string, detail: EventDetail): Promise<void> {
    try {
      const client = getClientEventBridge()

      const params = {
        Entries: [
          {
            Source: source,
            DetailType: detailType,
            EventBusName: this.eventBusName,
            Detail: JSON.stringify(detail)
          }
        ]
      }

      logger.info('EventBridgePublisher: publishing event', { source, detailType })

      const result = await client.send(new PutEventsCommand(params))

      if (result.FailedEntryCount && result.FailedEntryCount > 0) {
        logger.warn('EventBridgePublisher: some events failed', { failedCount: result.FailedEntryCount })
      }

      logger.info('EventBridgePublisher: event published', { source, detailType })
    } catch (error) {
      logger.error('EventBridgePublisher: failed to publish event', { error, source, detailType })
      throw error
    }
  }
}
