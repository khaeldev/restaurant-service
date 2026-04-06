import { IngredientName } from '../../value-objects/IngredientName'

export interface FarmersMarketResponse {
  quantitySold: number
}

export interface IFarmersMarketClient {
  buyIngredient(ingredientName: IngredientName): Promise<FarmersMarketResponse>
}
