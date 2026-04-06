import { ulid } from 'ulid'
import { IDishRepository } from '../../domain/services/repositories/IDishRepository'
import { IRecipeRepository } from '../../domain/services/repositories/IRecipeRepository'
import { IEventPublisher } from '../ports/out/events/IEventPublisher'
import { IOrderRepository } from '../../domain/services/repositories/IOrderRepository'
import { createDish } from '../../domain/aggregates/Dish'
import { OrderStatus } from '../../domain/value-objects/OrderStatus'

interface OrderCreatedEvent {
  orderId: string
  quantity: number
  status: string
  createdAt: string
}

export class SelectRecipesUsecase {
  constructor(
    private readonly dishRepository: IDishRepository,
    private readonly recipeRepository: IRecipeRepository,
    private readonly orderRepository: IOrderRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(orderCreatedEvent: OrderCreatedEvent): Promise<void> {
    const { orderId, quantity } = orderCreatedEvent

    try {
      // Update order status to IN_PROGRESS
      await this.orderRepository.updateOrderStatus(orderId, OrderStatus.IN_PROGRESS)

      // For each dish in the order
      for (let i = 0; i < quantity; i++) {
        // Select random recipe
        const recipe = await this.recipeRepository.getRandomRecipe()

        // Generate dish ID
        const dishId = ulid()

        // Create dish entity
        const dish = createDish(
          dishId,
          orderId,
          recipe.recipeId,
          recipe.name,
          recipe.ingredients
        )

        // Persist dish
        await this.dishRepository.createDish(dish)

        // Emit IngredientsRequested event for each dish
        await this.eventPublisher.publishEvent(
          'restaurant.service',
          'IngredientsRequested',
          {
            orderId: dish.orderId,
            dishId: dish.dishId,
            recipeId: dish.recipeId,
            recipeName: dish.recipeName,
            ingredients: dish.ingredients
          }
        )
      }
    } catch (error) {
      // Update order status to FAILED
      await this.orderRepository.updateOrderStatus(orderId, OrderStatus.FAILED)
      throw new Error(`Failed to select recipes for order ${orderId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
