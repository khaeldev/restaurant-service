import { DishStatus } from '../value-objects/DishStatus'
import { IngredientRequirement } from '../types/IngredientRequirement'

export interface Dish {
  dishId: string
  orderId: string
  recipeId: string
  recipeName: string
  status: DishStatus
  ingredients: IngredientRequirement[]
  preparedAt?: string
}

export class DishDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DishDomainError'
  }
}

export function createDish(
  dishId: string,
  orderId: string,
  recipeId: string,
  recipeName: string,
  ingredients: IngredientRequirement[]
): Dish {
  if (ingredients.length === 0) {
    throw new DishDomainError('Dish must have at least one ingredient')
  }

  return {
    dishId,
    orderId,
    recipeId,
    recipeName,
    status: DishStatus.WAITING_INGREDIENTS,
    ingredients
  }
}

export function updateDishStatus(dish: Dish, status: DishStatus): Dish {
  return {
    ...dish,
    status
  }
}

export function prepareDish(dish: Dish): Dish {
  if (dish.status !== DishStatus.PREPARING) {
    throw new DishDomainError('Dish must be in PREPARING status to be prepared')
  }

  return {
    ...dish,
    status: DishStatus.PREPARED,
    preparedAt: new Date().toISOString()
  }
}
