import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { getClientDynamoDB } from './schema/Client'
import { config } from '@config/environment'
import { IRecipeRepository } from '../../../domain/services/repositories/IRecipeRepository'
import { Recipe } from '../../../domain/aggregates/Recipe'
import { IngredientRequirement } from '@core/domain/types/IngredientRequirement'
import { IngredientName } from '@core/domain/value-objects/IngredientName'
import { logger } from '@powertools/utilities'

export class DynamoRecipeRepository implements IRecipeRepository {
  private readonly docClient: DynamoDBDocumentClient
  private readonly tableName: string
  private cachedRecipes: Recipe[] | null = null

  constructor() {
    const client = getClientDynamoDB()
    this.docClient = DynamoDBDocumentClient.from(client as DynamoDBClient)
    this.tableName = config.serviceTableName || 'restaurant-service-dev'
  }

  async getRecipeById(recipeId: string): Promise<Recipe | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `RECIPE#${recipeId}`,
          SK: 'METADATA'
        }
      })
    )

    if (!result.Item) {
      return null
    }

    return this.mapToRecipe(result.Item)
  }

  async getAllRecipes(): Promise<Recipe[]> {
    // Return cached recipes if available
    if (this.cachedRecipes) {
      return this.cachedRecipes
    }

    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :gsi2pk',
        ExpressionAttributeValues: {
          ':gsi2pk': 'TYPE#RECIPE'
        }
      })
    )
    logger.info('getallRecipes', {result})
    this.cachedRecipes = (result.Items || []).map(item => this.mapToRecipe(item))
    return this.cachedRecipes
  }

  async getRandomRecipe(): Promise<Recipe> {
    const recipes = await this.getAllRecipes()

    if (recipes.length === 0) {
      throw new Error('No recipes available')
    }

    const randomIndex = Math.floor(Math.random() * recipes.length)
    return recipes[randomIndex] as Recipe
  }

  async seedRecipes(recipes: Recipe[]): Promise<void> {
    for (const recipe of recipes) {
      const item = {
        PK: `RECIPE#${recipe.recipeId}`,
        SK: 'METADATA',
        EntityType: 'Recipe',
        recipeId: recipe.recipeId,
        name: recipe.name,
        ingredients: recipe.ingredients,
        GSI2PK: 'TYPE#RECIPE',
        GSI2SK: recipe.recipeId
      }

      await this.docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: item
        })
      )
    }

    // Clear cache after seeding
    this.cachedRecipes = null
  }

  private mapToRecipe(item: Record<string, unknown>): Recipe {
    return {
      recipeId: item.recipeId as string,
      name: item.name as IngredientName,
      ingredients: item.ingredients as IngredientRequirement[]
    }
  }
}
