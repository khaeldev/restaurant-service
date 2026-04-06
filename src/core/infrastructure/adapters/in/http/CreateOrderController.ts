import { APIGatewayProxyEvent } from 'aws-lambda'
import { CreateOrderSchema } from '@core/app/schemas/CreateOrderSchema'
import { CreateOrderUsecase } from '@core/app/usecases/CreateOrderUsecase'
import { logger } from '@powertools/utilities'

export class CreateOrderController {
  constructor(private readonly createOrderUsecase: CreateOrderUsecase) {}

  async execute(event: APIGatewayProxyEvent): Promise<unknown> {
    try {
      // Parse and validate input
      const body = event.body ? JSON.parse(event.body) : {}
      const validatedInput = CreateOrderSchema.parse(body)

      logger.info('CreateOrderController: validated input', { quantity: validatedInput.quantity })

      // Execute usecase
      const order = await this.createOrderUsecase.execute(validatedInput.quantity)

      logger.info('CreateOrderController: order created', { orderId: order.orderId })

      return {
        orderId: order.orderId,
        quantity: order.quantity,
        status: order.status,
        createdAt: order.createdAt
      }
    } catch (error) {
      logger.error('CreateOrderController: error', { error })
      throw error
    }
  }
}
