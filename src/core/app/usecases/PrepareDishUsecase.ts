import { IDishRepository } from '../../domain/services/repositories/IDishRepository'
import { IWarehouseRepository } from '../../domain/services/repositories/IWarehouseRepository'
import { IOrderRepository } from '../../domain/services/repositories/IOrderRepository'
import { IEventPublisher } from '../ports/out/events/IEventPublisher'
import { DishStatus } from '../../domain/value-objects/DishStatus'
import { OrderStatus } from '../../domain/value-objects/OrderStatus'
import { logger } from '@powertools/utilities'

interface IngredientsProcuredEvent {
  orderId: string
  dishId: string
  procuredAt: string
}

export class PrepareDishUsecase {
  constructor(
    private readonly dishRepository: IDishRepository,
    private readonly warehouseRepository: IWarehouseRepository,
    private readonly orderRepository: IOrderRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(ingredientsProcuredEvent: IngredientsProcuredEvent): Promise<void> {
    const { orderId, dishId } = ingredientsProcuredEvent

    try {
      // Get dish
      const dish = await this.dishRepository.getDish(orderId, dishId)
      logger.debug('PrepareDishUsecase: dish', { orderId, dishId, dish })

      if (!dish) {
        throw new Error(`Dish ${dishId} not found`)
      }

      // Update dish status to PREPARING
      await this.dishRepository.updateDishStatus(orderId, dishId, DishStatus.PREPARING)
      logger.debug('PrepareDishUsecase: updated dish status to PREPARING', { orderId, dishId })

      // Deduct ingredients from warehouse atomically
      await this.warehouseRepository.deductIngredients(dish.ingredients)
      logger.debug('PrepareDishUsecase: deducted ingredients from warehouse', { orderId, dishId, ingredients: dish.ingredients })

      // Update dish status to PREPARED
      const preparedAt = new Date().toISOString()
      await this.dishRepository.updateDishStatus(orderId, dishId, DishStatus.PREPARED, preparedAt)
      logger.debug('PrepareDishUsecase: updated dish status to PREPARED', { orderId, dishId, preparedAt })

      // Emit DishPrepared event
      await this.eventPublisher.publishEvent(
        'restaurant.service',
        'DishPrepared',
        {
          orderId,
          dishId,
          recipeName: dish.recipeName,
          preparedAt
        }
      )

      // Check if all dishes in order are prepared
      await this.checkOrderCompletion(orderId)
    } catch (error) {
      // Mark dish as failed
      logger.error('execute', {error, msg: JSON.stringify(error)})
      await this.dishRepository.updateDishStatus(orderId, dishId, DishStatus.FAILED)
      throw new Error(`Failed to prepare dish ${dishId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async checkOrderCompletion(orderId: string): Promise<void> {
    // Get order
    const order = await this.orderRepository.getOrderById(orderId)
    if (!order) {
      throw new Error(`Order ${orderId} not found`)
    }

    // Get all dishes for this order
    const dishes = await this.dishRepository.listDishesByOrder(orderId)

    // Check if all dishes are prepared
    const allPrepared = dishes.every(dish => dish.status === DishStatus.PREPARED)
    const totalDishes = dishes.length

    if (allPrepared && totalDishes === order.quantity) {
      // Update order status to COMPLETED
      await this.orderRepository.updateOrderStatus(orderId, OrderStatus.COMPLETED)

      // Emit OrderCompleted event
      await this.eventPublisher.publishEvent(
        'restaurant.service',
        'OrderCompleted',
        {
          orderId,
          quantity: order.quantity,
          completedAt: new Date().toISOString()
        }
      )
    }
  }
}
