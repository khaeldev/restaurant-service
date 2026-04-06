import { IngredientRequirement } from '../types/IngredientRequirement'

export interface Recipe {
  recipeId: string
  name: string
  ingredients: IngredientRequirement[]
}

export class RecipeDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RecipeDomainError'
  }
}

export function createRecipe(
  recipeId: string,
  name: string,
  ingredients: IngredientRequirement[]
): Recipe {

  if (ingredients.length === 0) {
    throw new RecipeDomainError('Recipe must have at least one ingredient')
  }

  // Validate all quantities are positive
  for (const ingredient of ingredients) {
    if (ingredient.quantity <= 0) {
      throw new RecipeDomainError(`Ingredient ${ingredient.name} quantity must be positive`)
    }
  }

  return {
    recipeId,
    name,
    ingredients
  }
}
