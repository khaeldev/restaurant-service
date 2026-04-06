import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { getClientDynamoDB } from './schema/Client'
import { config } from '@config/environment'
import { IUserRepository } from '../../../domain/services/repositories/IUserRepository'
import { User, LoginAttempt } from '../../../domain/aggregates/User'

export class DynamoUserRepository implements IUserRepository {
  private readonly docClient: DynamoDBDocumentClient
  private readonly tableName: string

  constructor() {
    const client = getClientDynamoDB()
    this.docClient = DynamoDBDocumentClient.from(client as DynamoDBClient, {
      marshallOptions: {
        removeUndefinedValues: true
      }
    })
    this.tableName = config.serviceTableName || 'restaurant-service-dev'
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :gsi1pk',
        ExpressionAttributeValues: {
          ':gsi1pk': `USER#${email}`
        },
        Limit: 1
      })
    )

    if (!result.Items || result.Items.length === 0) {
      return null
    }

    return this.mapToUser(result.Items[0] as Record<string, unknown>)
  }

  async createUser(user: User): Promise<void> {
    const item = {
      PK: `USER#${user.userId}`,
      SK: 'METADATA',
      EntityType: 'User',
      userId: user.userId,
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      GSI1PK: `USER#${user.email}`,
      GSI1SK: user.createdAt
    }

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item
      })
    )
  }

  async recordLoginAttempt(attempt: LoginAttempt): Promise<void> {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    const item = {
      PK: `LOGIN_ATTEMPT#${attempt.email}#${today}`,
      SK: attempt.attemptId,
      EntityType: 'LoginAttempt',
      attemptId: attempt.attemptId,
      email: attempt.email,
      success: attempt.success,
      timestamp: attempt.timestamp,
      ipAddress: attempt.ipAddress,
      TTL: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days TTL
    }

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item
      })
    )
  }

  async getFailedLoginAttemptsToday(email: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `LOGIN_ATTEMPT#${email}#${today}`,
          ':success': true
        },
        FilterExpression: 'success = :success'
      })
    )

    // Count failed attempts (total - successful)
    const totalAttempts = result.Items?.length || 0
    const successfulAttempts = (result.Items || []).filter(
      (item) => item.success === true
    ).length

    return totalAttempts - successfulAttempts
  }

  private mapToUser(item: Record<string, unknown>): User {
    return {
      userId: item.userId as string,
      email: item.email as string,
      passwordHash: item.passwordHash as string,
      createdAt: item.createdAt as string,
      lastLoginAt: item.lastLoginAt as string | undefined
    }
  }
}
