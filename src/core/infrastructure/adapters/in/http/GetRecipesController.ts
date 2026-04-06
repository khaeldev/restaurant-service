import { APIGatewayProxyEvent } from 'aws-lambda'
import { IRecipeRepository } from '@core/domain/services/repositories/IRecipeRepository'
import { logger } from '@powertools/utilities'

export class GetRecipesController {
  constructor(private readonly recipeRepository: IRecipeRepository) {}

  async execute(_event: APIGatewayProxyEvent): Promise<unknown> {
    try {
      logger.info('GetRecipesController: fetching recipes')

      // Get all recipes
      const recipes = await this.recipeRepository.getAllRecipes()

      logger.info('GetRecipesController: recipes fetched', { count: recipes.length })

      return {
        recipes: recipes.map(recipe => ({
          recipeId: recipe.recipeId,
          name: recipe.name,
          ingredients: recipe.ingredients
        }))
      }
    } catch (error) {
      logger.error('GetRecipesController: error', { error })
      throw error
    }
  }
}
