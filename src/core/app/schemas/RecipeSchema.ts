import { z } from 'zod'
import { VALID_INGREDIENTS } from '../../domain/value-objects/IngredientName'

export const RecipeIngredientSchema = z.object({
  name: z.enum(VALID_INGREDIENTS),
  quantity: z.number().int().positive()
})

export const RecipeSchema = z.object({
  recipeId: z.string(),
  name: z.string(),
  ingredients: z.array(RecipeIngredientSchema).min(1)
})

export const RecipesResponseSchema = z.object({
  recipes: z.array(RecipeSchema)
})

export type RecipeItem = z.infer<typeof RecipeSchema>
export type RecipesResponse = z.infer<typeof RecipesResponseSchema>
