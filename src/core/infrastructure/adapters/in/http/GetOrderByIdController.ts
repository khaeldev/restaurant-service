import { APIGatewayProxyEvent } from 'aws-lambda'
import { IOrderRepository } from '@core/domain/services/repositories/IOrderRepository'
import { IDishRepository } from '@core/domain/services/repositories/IDishRepository'
import { logger } from '@powertools/utilities'

export class GetOrderByIdController {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly dishRepository: IDishRepository
  ) {}

  async execute(event: APIGatewayProxyEvent): Promise<unknown> {
    try {
      const orderId = event.pathParameters?.orderId

      if (!orderId) {
        throw new Error('Order ID is required')
      }

      logger.info('GetOrderByIdController: fetching order', { orderId })

      // Get order
      const order = await this.orderRepository.getOrderById(orderId)
      if (!order) {
        throw new Error(`Order ${orderId} not found`)
      }

      // Get dishes for this order
      const dishes = await this.dishRepository.listDishesByOrder(orderId)

      logger.info('GetOrderByIdController: order found', { orderId, dishCount: dishes.length })

      return {
        order,
        dishes
      }
    } catch (error) {
      logger.error('GetOrderByIdController: error', { error })
      throw error
    }
  }
}
