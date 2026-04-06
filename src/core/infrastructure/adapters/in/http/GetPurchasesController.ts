import { APIGatewayProxyEvent } from 'aws-lambda'
import { IPurchaseRepository } from '@core/domain/services/repositories/IPurchaseRepository'
import { logger } from '@powertools/utilities'

export class GetPurchasesController {
  constructor(private readonly purchaseRepository: IPurchaseRepository) {}

  async execute(event: APIGatewayProxyEvent): Promise<unknown> {
    try {
      const limit = event.queryStringParameters?.limit
        ? parseInt(event.queryStringParameters.limit, 10)
        : 50
      const cursor = event.queryStringParameters?.cursor

      logger.info('GetPurchasesController: fetching purchases', { limit, cursor })

      // Get purchase history
      const result = await this.purchaseRepository.listPurchases({ limit, cursor })

      logger.info('GetPurchasesController: purchases fetched', { count: result.items.length })

      return {
        purchases: result.items,
        nextCursor: result.nextCursor
      }
    } catch (error) {
      logger.error('GetPurchasesController: error', { error })
      throw error
    }
  }
}
