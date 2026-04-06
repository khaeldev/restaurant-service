export const VALID_INGREDIENTS = [
  'tomato',
  'lemon',
  'potato',
  'rice',
  'ketchup',
  'lettuce',
  'onion',
  'cheese',
  'meat',
  'chicken'
] as const

export type IngredientName = typeof VALID_INGREDIENTS[number]

export function isValidIngredient(name: string): name is IngredientName {
  return VALID_INGREDIENTS.includes(name as IngredientName)
}

export class InvalidIngredientError extends Error {
  constructor(ingredientName: string) {
    super(`Invalid ingredient: ${ingredientName}. Valid ingredients are: ${VALID_INGREDIENTS.join(', ')}`)
    this.name = 'InvalidIngredientError'
  }
}
