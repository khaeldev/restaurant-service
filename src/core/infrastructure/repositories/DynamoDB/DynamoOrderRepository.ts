import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { getClientDynamoDB } from './schema/Client'
import { config } from '@config/environment'
import { IOrderRepository, Pagination, PaginatedResult } from '../../../domain/services/repositories/IOrderRepository'
import { Order } from '../../../domain/aggregates/Order'
import { OrderStatus } from '../../../domain/value-objects/OrderStatus'

export class DynamoOrderRepository implements IOrderRepository {
  private readonly docClient: DynamoDBDocumentClient
  private readonly tableName: string

  constructor() {
    const client = getClientDynamoDB()
    this.docClient = DynamoDBDocumentClient.from(client as DynamoDBClient)
    this.tableName = config.serviceTableName || 'restaurant-service-dev'
  }

  async createOrder(order: Order): Promise<void> {
    const item = {
      PK: `ORDER#${order.orderId}`,
      SK: 'METADATA',
      EntityType: 'Order',
      orderId: order.orderId,
      quantity: order.quantity,
      status: order.status,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      GSI1PK: `ORDER_STATUS#${order.status}`,
      GSI1SK: order.createdAt,
      GSI2PK: 'TYPE#ORDER',
      GSI2SK: order.createdAt
    }

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item
      })
    )
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `ORDER#${orderId}`,
          SK: 'METADATA'
        }
      })
    )

    if (!result.Item) {
      return null
    }

    return this.mapToOrder(result.Item)
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const now = new Date().toISOString()
    const updateExpression = status === OrderStatus.COMPLETED
      ? 'SET #status = :status, completedAt = :completedAt, GSI1PK = :gsi1pk'
      : 'SET #status = :status, GSI1PK = :gsi1pk'

    const expressionAttributeValues: Record<string, unknown> = {
      ':status': status,
      ':gsi1pk': `ORDER_STATUS#${status}`
    }

    if (status === OrderStatus.COMPLETED) {
      expressionAttributeValues[':completedAt'] = now
    }

    await this.docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `ORDER#${orderId}`,
          SK: 'METADATA'
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: expressionAttributeValues
      })
    )
  }

  async listOrders(
    filters: { status?: OrderStatus },
    pagination: Pagination
  ): Promise<PaginatedResult<Order>> {
    const limit = pagination.limit || 20

    if (filters.status) {
      // Use GSI1 to filter by status
      const result = await this.docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'GSI1',
          KeyConditionExpression: 'GSI1PK = :gsi1pk',
          ExpressionAttributeValues: {
            ':gsi1pk': `ORDER_STATUS#${filters.status}`
          },
          Limit: limit,
          ExclusiveStartKey: pagination.cursor ? JSON.parse(Buffer.from(pagination.cursor, 'base64').toString()) : undefined,
          ScanIndexForward: false
        })
      )

      return {
        items: (result.Items || []).map(item => this.mapToOrder(item)),
        nextCursor: result.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
          : undefined
      }
    } else {
      // Use GSI2 to get all orders
      const result = await this.docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'GSI2',
          KeyConditionExpression: 'GSI2PK = :gsi2pk',
          ExpressionAttributeValues: {
            ':gsi2pk': 'TYPE#ORDER'
          },
          Limit: limit,
          ExclusiveStartKey: pagination.cursor ? JSON.parse(Buffer.from(pagination.cursor, 'base64').toString()) : undefined,
          ScanIndexForward: false
        })
      )

      return {
        items: (result.Items || []).map(item => this.mapToOrder(item)),
        nextCursor: result.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
          : undefined
      }
    }
  }

  private mapToOrder(item: Record<string, unknown>): Order {
    return {
      orderId: item.orderId as string,
      quantity: item.quantity as number,
      status: item.status as OrderStatus,
      createdAt: item.createdAt as string,
      completedAt: item.completedAt as string | undefined
    }
  }
}
