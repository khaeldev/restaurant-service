import { IngredientName } from '../value-objects/IngredientName'

export interface IngredientRequirement {
  name: IngredientName
  quantity: number
}
