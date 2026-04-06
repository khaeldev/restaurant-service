import { APIGatewayProxyEvent } from 'aws-lambda'
import { GetConversationHistoryUsecase } from '@core/app/usecases/GetConversationHistoryUsecase'
import { logger } from '@powertools/utilities'

export class GetConversationHistoryController {
  constructor(private readonly getConversationHistoryUsecase: GetConversationHistoryUsecase) {}

  async execute(event: APIGatewayProxyEvent): Promise<unknown> {
    try {
      const sessionId = event.pathParameters?.sessionId

      if (!sessionId) {
        throw new Error('Session ID is required')
      }

      logger.info('GetConversationHistoryController: fetching history', { sessionId })

      const conversation = await this.getConversationHistoryUsecase.execute(sessionId)

      if (!conversation) {
        return {
          conversation: null,
          messages: []
        }
      }

      return {
        conversation: {
          conversationId: conversation.conversationId,
          sessionId: conversation.sessionId,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt
        },
        messages: conversation.messages
      }
    } catch (error) {
      logger.error('GetConversationHistoryController: error', { error })
      throw error
    }
  }
}
