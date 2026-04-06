import { ulid } from 'ulid'
import { IWarehouseRepository } from '../../domain/services/repositories/IWarehouseRepository'
import { IPurchaseRepository } from '../../domain/services/repositories/IPurchaseRepository'
import { IFarmersMarketClient } from '../../domain/services/repositories/IFarmersMarketClient'
import { IEventPublisher } from '../ports/out/events/IEventPublisher'
import { IngredientRequirement } from '../../domain/types/IngredientRequirement'
import { createPurchaseRecord } from '../../domain/aggregates/PurchaseHistory'
import { IngredientName } from '../../domain/value-objects/IngredientName'
import { logger } from '@powertools/utilities'

interface IngredientsRequestedEvent {
  orderId: string
  dishId: string
  recipeId: string
  recipeName: string
  ingredients: IngredientRequirement[]
}

export class ProcureIngredientsUsecase {
  constructor(
    private readonly warehouseRepository: IWarehouseRepository,
    private readonly purchaseRepository: IPurchaseRepository,
    private readonly farmersMarketClient: IFarmersMarketClient,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(ingredientsRequestedEvent: IngredientsRequestedEvent): Promise<void> {
    const { orderId, dishId, ingredients } = ingredientsRequestedEvent
    logger.info('execute', {orderId, dishId, ingredients})

    try {
      // Procure ingredients and then atomically reserve them.
      // Retry if a concurrent order reserved the same stock between our
      // procure and reserve steps (TOCTOU race condition).
      const maxReserveRetries = 3
      for (let attempt = 0; attempt < maxReserveRetries; attempt++) {
        for (const ingredient of ingredients) {
          await this.procureIngredient(ingredient, orderId)
        }

        try {
          // Atomically reserve all ingredients in one DynamoDB transaction.
          // The ConditionExpression inside ensures no over-reservation.
          await this.warehouseRepository.reserveIngredients(ingredients)
          break // reservation succeeded
        } catch (reserveError) {
          if (attempt === maxReserveRetries - 1) {
            throw reserveError
          }
          // Another concurrent order grabbed the stock; re-procure the deficit.
          logger.warn('reserveIngredients failed due to concurrent order, retrying procurement', { attempt, reserveError })
        }
      }

      await this.eventPublisher.publishEvent(
        'restaurant.service',
        'IngredientsProcured',
        {
          orderId,
          dishId,
          procuredAt: new Date().toISOString()
        }
      )
    } catch (error) {
      throw new Error(`Failed to procure ingredients for dish ${dishId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async procureIngredient(ingredient: IngredientRequirement, orderId: string): Promise<void> {
    const { name, quantity } = ingredient

    // Check warehouse inventory
    let inventory = await this.warehouseRepository.getInventory(name)
    logger.info('inventory', {inventory})

    //  available quantity
    const availableQuantity = (inventory?.availableQuantity || 0)

    if (!inventory || availableQuantity < quantity) {
      // Need to purchase from farmers market
      const deficit = quantity - Math.max(0, availableQuantity)
      await this.purchaseFromMarket(name, deficit, orderId)

      // Verify inventory is now sufficient
      inventory = await this.warehouseRepository.getInventory(name)
      const newAvailableQuantity = (inventory?.availableQuantity || 0)
      if (!inventory || newAvailableQuantity < quantity) {
        throw new Error(`Insufficient inventory for ${name}. Required: ${quantity}, Available: ${newAvailableQuantity}`)
      }
    }
  }

  private async purchaseFromMarket(
    ingredientName: IngredientName,
    quantity: number,
    orderId: string
  ): Promise<void> {
    const maxRetries = 5
    let totalPurchased = 0

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        logger.debug('ProcureIngredientsUsecase: buying ingredient', { ingredientName, quantity, orderId, attempt, time: new Date().toISOString() })
        const response = await this.farmersMarketClient.buyIngredient(ingredientName)

        if (response.quantitySold > 0) {
          totalPurchased += response.quantitySold

          // Add to warehouse inventory
          await this.warehouseRepository.addStock(ingredientName, response.quantitySold)

          // Record purchase
          const purchaseId = ulid()
          const purchase = createPurchaseRecord(
            purchaseId,
            ingredientName,
            response.quantitySold,
            orderId
          )
          await this.purchaseRepository.recordPurchase(purchase)

          // Check if we have enough now
          if (totalPurchased >= quantity) {
            logger.info('purchaseFromMarket total', {totalPurchased})
            return
          }
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000
        await this.sleep(delay)
      } catch (error) {
        logger.error('error', {error})
        if (attempt === maxRetries - 1) {
          throw new Error(`Failed to purchase ${ingredientName} after ${maxRetries} retries`)
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000
        await this.sleep(delay)
      }
    }
    logger.info('purchaseFromMarket total G', {totalPurchased})
    
    if (totalPurchased < quantity) {
      logger.error('purchaseFromMarket Error', {totalPurchased})
      
      throw new Error(`Could not purchase enough ${ingredientName}. Required: ${quantity}, Purchased: ${totalPurchased}`)
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
