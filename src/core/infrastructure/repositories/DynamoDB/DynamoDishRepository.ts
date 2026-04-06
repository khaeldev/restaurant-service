import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { getClientDynamoDB } from './schema/Client'
import { config } from '@config/environment'
import { IDishRepository } from '../../../domain/services/repositories/IDishRepository'
import { Dish } from '../../../domain/aggregates/Dish'
import { DishStatus } from '../../../domain/value-objects/DishStatus'
import { IngredientRequirement } from '@core/domain/types/IngredientRequirement'

export class DynamoDishRepository implements IDishRepository {
  private readonly docClient: DynamoDBDocumentClient
  private readonly tableName: string

  constructor() {
    const client = getClientDynamoDB()
    this.docClient = DynamoDBDocumentClient.from(client as DynamoDBClient)
    this.tableName = config.serviceTableName || 'restaurant-service-dev'
  }

  async createDish(dish: Dish): Promise<void> {
    const item = {
      PK: `ORDER#${dish.orderId}`,
      SK: `DISH#${dish.dishId}`,
      EntityType: 'Dish',
      dishId: dish.dishId,
      orderId: dish.orderId,
      recipeId: dish.recipeId,
      recipeName: dish.recipeName,
      status: dish.status,
      ingredients: dish.ingredients,
      preparedAt: dish.preparedAt
    }

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item
      })
    )
  }

  async getDish(orderId: string, dishId: string): Promise<Dish | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `ORDER#${orderId}`,
          SK: `DISH#${dishId}`
        }
      })
    )

    if (!result.Item) {
      return null
    }

    return this.mapToDish(result.Item)
  }

  async updateDishStatus(orderId: string, dishId: string, status: DishStatus, preparedAt?: string): Promise<void> {
    const updateExpression = preparedAt
      ? 'SET #status = :status, preparedAt = :preparedAt'
      : 'SET #status = :status'

    const expressionAttributeValues: Record<string, unknown> = {
      ':status': status
    }

    if (preparedAt) {
      expressionAttributeValues[':preparedAt'] = preparedAt
    }

    await this.docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `ORDER#${orderId}`,
          SK: `DISH#${dishId}`
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: expressionAttributeValues
      })
    )
  }

  async listDishesByOrder(orderId: string): Promise<Dish[]> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': `ORDER#${orderId}`,
          ':skPrefix': 'DISH#'
        }
      })
    )

    return (result.Items || []).map(item => this.mapToDish(item))
  }

  async countDishesByOrderAndStatus(orderId: string, status: DishStatus): Promise<number> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':pk': `ORDER#${orderId}`,
          ':skPrefix': 'DISH#',
          ':status': status
        },
        Select: 'COUNT'
      })
    )

    return result.Count || 0
  }

  private mapToDish(item: Record<string, unknown>): Dish {
    return {
      dishId: item.dishId as string,
      orderId: item.orderId as string,
      recipeId: item.recipeId as string,
      recipeName: item.recipeName as string,
      status: item.status as DishStatus,
      ingredients: item.ingredients as IngredientRequirement[],
      preparedAt: item.preparedAt as string | undefined
    }
  }
}
