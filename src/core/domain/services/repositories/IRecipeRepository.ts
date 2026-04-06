import { Recipe } from '../../aggregates/Recipe'

export interface IRecipeRepository {
  getRecipeById(recipeId: string): Promise<Recipe | null>
  getAllRecipes(): Promise<Recipe[]>
  getRandomRecipe(): Promise<Recipe>
  seedRecipes(recipes: Recipe[]): Promise<void>
}
