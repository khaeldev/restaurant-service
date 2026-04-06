import { ulid } from 'ulid'
import { IOrderRepository } from '../../domain/services/repositories/IOrderRepository'
import { IEventPublisher } from '../ports/out/events/IEventPublisher'
import { createOrder, Order, OrderDomainError } from '../../domain/aggregates/Order'

export class CreateOrderUsecase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(quantity: number): Promise<Order> {
    try {
      // Generate order ID
      const orderId = ulid()

      // Create order entity
      const order = createOrder(orderId, quantity)

      // Persist order
      await this.orderRepository.createOrder(order)

      // Emit OrderCreated event
      await this.eventPublisher.publishEvent(
        'restaurant.service',
        'OrderCreated',
        {
          orderId: order.orderId,
          quantity: order.quantity,
          status: order.status,
          createdAt: order.createdAt
        }
      )

      return order
    } catch (error) {
      if (error instanceof OrderDomainError) {
        throw error
      }
      throw new Error(`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
