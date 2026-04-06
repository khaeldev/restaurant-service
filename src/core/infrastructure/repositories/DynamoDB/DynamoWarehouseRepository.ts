import { DynamoDBDocumentClient, GetCommand, QueryCommand, UpdateCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { getClientDynamoDB } from './schema/Client'
import { config } from '@config/environment'
import { IWarehouseRepository } from '../../../domain/services/repositories/IWarehouseRepository'
import { WarehouseInventory } from '../../../domain/aggregates/WarehouseInventory'
import { IngredientName } from '../../../domain/value-objects/IngredientName'
import { IngredientRequirement } from '../../../domain/types/IngredientRequirement'
import { logger } from '@powertools/utilities'

export class DynamoWarehouseRepository implements IWarehouseRepository {
  private readonly docClient: DynamoDBDocumentClient
  private readonly tableName: string

  constructor() {
    const client = getClientDynamoDB()
    this.docClient = DynamoDBDocumentClient.from(client as DynamoDBClient)
    this.tableName = config.serviceTableName || 'restaurant-service-dev'
  }
  async reserveIngredients(ingredients: IngredientRequirement[]): Promise<boolean> {
    // Use TransactWriteItems to atomically reserve ingredients
    // Merge duplicate ingredients to avoid transaction conflicts
    const mergedIngredients = new Map<string, number>()
    for (const ingredient of ingredients) {
      const current = mergedIngredients.get(ingredient.name) || 0
      mergedIngredients.set(ingredient.name, current + ingredient.quantity)
    }

    const transactItems = Array.from(mergedIngredients.entries()).map(([name, quantity]) => ({
      Update: {
        TableName: this.tableName,
        Key: {
          PK: `INVENTORY#${name}`,
          SK: 'METADATA'
        },
        UpdateExpression: 'SET availableQuantity = availableQuantity - :qty, reservedQuantity = reservedQuantity + :qty, updatedAt = :now',
        ConditionExpression: 'availableQuantity >= :qty',
        ExpressionAttributeValues: {
          ':qty': quantity,
          ':now': new Date().toISOString()
        }
      }
    }))

    // Only retry for TransactionConflict (two concurrent transactions on the same item).
    // ConditionalCheckFailed means stock is genuinely insufficient — propagate immediately
    // so the caller can re-procure before retrying the reservation.
    const maxRetries = 3
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await this.docClient.send(new TransactWriteCommand({ TransactItems: transactItems }))
        return true
      } catch (error) {
        if (this.isTransactionCancelledWithReason(error, 'ConditionalCheckFailed') || attempt === maxRetries - 1) {
          throw error
        }

        // Exponential backoff with jitter for TransactionConflict only.
        // Jitter avoids thundering herd when many concurrent orders retry simultaneously.
        const base = Math.pow(2, attempt) * 100
        const delay = base + Math.random() * base
        await this.sleep(delay)
      }
    }
    return false
  }

  private isTransactionCancelledWithReason(error: unknown, reason: string): boolean {
    if (error instanceof Error && error.name === 'TransactionCanceledException') {
      const cancellationReasons = (error as { CancellationReasons?: { Code: string }[] }).CancellationReasons || []
      return cancellationReasons.some(r => r.Code === reason)
    }
    return false
  }

  async getInventory(ingredientName: IngredientName): Promise<WarehouseInventory | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `INVENTORY#${ingredientName}`,
          SK: 'METADATA'
        }
      })
    )

    if (!result.Item) {
      return null
    }

    return this.mapToInventory(result.Item)
  }

  async getAllInventory(): Promise<WarehouseInventory[]> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :gsi2pk',
        ExpressionAttributeValues: {
          ':gsi2pk': 'TYPE#INVENTORY'
        }
      })
    )

    return (result.Items || []).map(item => this.mapToInventory(item))
  }

  async addStock(ingredientName: IngredientName, quantity: number): Promise<void> {
    await this.docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `INVENTORY#${ingredientName}`,
          SK: 'METADATA'
        },
        UpdateExpression: 'SET availableQuantity = availableQuantity + :qty, updatedAt = :now',
        ExpressionAttributeValues: {
          ':qty': quantity,
          ':now': new Date().toISOString()
        }
      })
    )
  }

  async deductIngredients(ingredients: IngredientRequirement[]): Promise<void> {
    // Use TransactWriteItems for atomic deductions
    // Deduct only from reservedQuantity (availableQuantity was already deducted when reserved)
    logger.info('deductIngredients', {ingredients})

    // Merge duplicate ingredients to avoid transaction conflicts
    const mergedIngredients = new Map<string, number>()
    for (const ingredient of ingredients) {
      const current = mergedIngredients.get(ingredient.name) || 0
      mergedIngredients.set(ingredient.name, current + ingredient.quantity)
    }

    // Retry logic for transaction conflicts
    const maxRetries = 3
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const transactItems = Array.from(mergedIngredients.entries()).map(([name, quantity]) => ({
          Update: {
            TableName: this.tableName,
            Key: {
              PK: `INVENTORY#${name}`,
              SK: 'METADATA'
            },
            UpdateExpression: 'SET reservedQuantity = reservedQuantity - :qty, updatedAt = :now',
            ConditionExpression: 'reservedQuantity >= :qty',
            ExpressionAttributeValues: {
              ':qty': quantity,
              ':now': new Date().toISOString()
            }
          }
        }))

        await this.docClient.send(
          new TransactWriteCommand({
            TransactItems: transactItems
          })
        )
        return
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error
        }

        // Exponential backoff for transaction conflicts
        const delay = Math.pow(2, attempt) * 100
        await this.sleep(delay)
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async hasEnoughStock(ingredientName: IngredientName, quantity: number): Promise<boolean> {
    const inventory = await this.getInventory(ingredientName)
    if (!inventory) {
      return false
    }
    return inventory.availableQuantity >= quantity
  }

  private mapToInventory(item: Record<string, unknown>): WarehouseInventory {
    return {
      ingredientName: item.ingredientName as IngredientName,
      availableQuantity: item.availableQuantity as number,
      reservedQuantity: item.reservedQuantity as number,
      updatedAt: item.updatedAt as string
    }
  }
}
