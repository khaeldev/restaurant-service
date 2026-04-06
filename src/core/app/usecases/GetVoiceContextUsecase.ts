import { IOrderRepository } from '../../domain/services/repositories/IOrderRepository'
import { IRecipeRepository } from '../../domain/services/repositories/IRecipeRepository'
import { IWarehouseRepository } from '../../domain/services/repositories/IWarehouseRepository'
import { VoiceContext } from '../../domain/services/repositories/IVoiceAIClient'
import { WarehouseInventory } from '../../domain/aggregates/WarehouseInventory'
import { Recipe } from '../../domain/aggregates/Recipe'
import { Order } from '../../domain/aggregates/Order'

export class GetVoiceContextUsecase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly recipeRepository: IRecipeRepository,
    private readonly warehouseRepository: IWarehouseRepository
  ) {}

  async execute(): Promise<VoiceContext> {
    const [inventory, recipes, recentOrders] = await Promise.all([
      this.warehouseRepository.getAllInventory(),
      this.recipeRepository.getAllRecipes(),
      this.orderRepository.listOrders({ status: undefined }, { limit: 10 })
    ])

    return {
      inventory: inventory.map((i: WarehouseInventory) => ({
        ingredientName: i.ingredientName,
        availableQuantity: i.availableQuantity
      })),
      recipes: recipes.map((r: Recipe) => ({
        recipeId: r.recipeId,
        name: r.name,
        ingredients: r.ingredients
      })),
      recentOrders: recentOrders.items.map((o: Order) => ({
        orderId: o.orderId,
        quantity: o.quantity,
        status: o.status,
        createdAt: o.createdAt
      }))
    }
  }
}
