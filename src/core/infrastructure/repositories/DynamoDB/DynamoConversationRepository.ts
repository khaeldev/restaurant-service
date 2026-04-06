import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { getClientDynamoDB } from './schema/Client'
import { config } from '@config/environment'
import { IConversationRepository } from '../../../domain/services/repositories/IConversationRepository'
import { Conversation, ConversationMessage } from '../../../domain/aggregates/Conversation'

export class DynamoConversationRepository implements IConversationRepository {
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

  async createConversation(conversation: Conversation): Promise<void> {
    const item = {
      PK: `CONVERSATION#${conversation.conversationId}`,
      SK: 'METADATA',
      EntityType: 'Conversation',
      conversationId: conversation.conversationId,
      sessionId: conversation.sessionId,
      messages: conversation.messages,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      TTL: conversation.expiresAt,
      GSI1PK: `SESSION#${conversation.sessionId}`,
      GSI1SK: conversation.createdAt
    }

    try {
      await this.docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: item
        })
      )
    } catch (error) {
      throw new Error(`Failed to create conversation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getConversationBySessionId(sessionId: string): Promise<Conversation | null> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :gsi1pk',
        ExpressionAttributeValues: {
          ':gsi1pk': `SESSION#${sessionId}`
        },
        ScanIndexForward: false,
        Limit: 1
      })
    )

    if (!result.Items || result.Items.length === 0) {
      return null
    }

    return this.mapToConversation(result.Items[0] as Record<string, unknown>)
  }

  async updateConversation(conversation: Conversation): Promise<void> {
    await this.docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `CONVERSATION#${conversation.conversationId}`,
          SK: 'METADATA'
        },
        UpdateExpression: 'SET messages = :messages, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':messages': conversation.messages,
          ':updatedAt': conversation.updatedAt
        }
      })
    )
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `CONVERSATION#${conversationId}`,
          SK: 'METADATA'
        }
      })
    )
  }

  private mapToConversation(item: Record<string, unknown>): Conversation {
    return {
      conversationId: item.conversationId as string,
      sessionId: item.sessionId as string,
      messages: item.messages as ConversationMessage[],
      createdAt: item.createdAt as string,
      updatedAt: item.updatedAt as string,
      expiresAt: (item.TTL as number) || Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
    }
  }
}
