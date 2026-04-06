import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { getClientDynamoDB } from './schema/Client'
import { config } from '@config/environment'
import { IPurchaseRepository } from '../../../domain/services/repositories/IPurchaseRepository'
import { PurchaseHistory } from '../../../domain/aggregates/PurchaseHistory'
import { PaginatedResult, Pagination } from '@core/domain/services/repositories/IOrderRepository'
import { IngredientName } from '@core/domain/value-objects/IngredientName'

export class DynamoPurchaseRepository implements IPurchaseRepository {
  private readonly docClient: DynamoDBDocumentClient
  private readonly tableName: string

  constructor() {
    const client = getClientDynamoDB()
    this.docClient = DynamoDBDocumentClient.from(client as DynamoDBClient)
    this.tableName = config.serviceTableName || 'restaurant-service-dev'
  }

  async recordPurchase(purchase: PurchaseHistory): Promise<void> {
    const item = {
      PK: `PURCHASE#${purchase.purchaseId}`,
      SK: 'METADATA',
      EntityType: 'Purchase',
      purchaseId: purchase.purchaseId,
      ingredientName: purchase.ingredientName,
      quantityPurchased: purchase.quantityPurchased,
      purchasedAt: purchase.purchasedAt,
      orderId: purchase.orderId,
      GSI3PK: 'TYPE#PURCHASE',
      GSI3SK: purchase.purchasedAt
    }

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item
      })
    )
  }

  async listPurchases(pagination: Pagination): Promise<PaginatedResult<PurchaseHistory>> {
    const limit = pagination.limit || 50

    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI3',
        KeyConditionExpression: 'GSI3PK = :gsi3pk',
        ExpressionAttributeValues: {
          ':gsi3pk': 'TYPE#PURCHASE'
        },
        Limit: limit,
        ExclusiveStartKey: pagination.cursor ? JSON.parse(Buffer.from(pagination.cursor, 'base64').toString()) : undefined,
        ScanIndexForward: false
      })
    )

    return {
      items: (result.Items || []).map(item => this.mapToPurchase(item)),
      nextCursor: result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : undefined
    }
  }

  private mapToPurchase(item: Record<string, unknown>): PurchaseHistory {
    return {
      purchaseId: item.purchaseId as string,
      ingredientName: item.ingredientName as IngredientName,
      quantityPurchased: item.quantityPurchased as number,
      purchasedAt: item.purchasedAt as string,
      orderId: item.orderId as string | undefined
    }
  }
}
