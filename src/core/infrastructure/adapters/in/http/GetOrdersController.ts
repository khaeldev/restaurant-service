import { APIGatewayProxyEvent } from 'aws-lambda'
import { IOrderRepository } from '@core/domain/services/repositories/IOrderRepository'
import { OrderStatus } from '@core/domain/value-objects/OrderStatus'
import { logger } from '@powertools/utilities'

export class GetOrdersController {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(event: APIGatewayProxyEvent): Promise<unknown> {
    try {
      // Get query parameters
      const status = event.queryStringParameters?.status as OrderStatus | undefined
      const limit = event.queryStringParameters?.limit
        ? parseInt(event.queryStringParameters.limit, 10)
        : 20
      const cursor = event.queryStringParameters?.cursor

      logger.info('GetOrdersController: fetching orders', { status, limit, cursor })

      // Execute repository query
      const result = await this.orderRepository.listOrders(
        { status },
        { limit, cursor }
      )

      return {
        orders: result.items,
        nextCursor: result.nextCursor
      }
    } catch (error) {
      logger.error('GetOrdersController: error', { error })
      throw error
    }
  }
}
