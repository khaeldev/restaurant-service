import { WarehouseInventory } from '../../aggregates/WarehouseInventory'
import { IngredientName } from '../../value-objects/IngredientName'
import { IngredientRequirement } from '../../types/IngredientRequirement'

export interface IWarehouseRepository {
  getInventory(ingredientName: IngredientName): Promise<WarehouseInventory | null>
  getAllInventory(): Promise<WarehouseInventory[]>
  reserveIngredients(ingredients: IngredientRequirement[]): Promise<boolean>
  deductIngredients(ingredients: IngredientRequirement[]): Promise<void>
  addStock(ingredientName: IngredientName, quantity: number): Promise<void>
}
