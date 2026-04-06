import { IConversationRepository } from '../../domain/services/repositories/IConversationRepository'
import { Conversation } from '../../domain/aggregates/Conversation'

export class GetConversationHistoryUsecase {
  constructor(private readonly conversationRepository: IConversationRepository) {}

  async execute(sessionId: string): Promise<Conversation | null> {
    return this.conversationRepository.getConversationBySessionId(sessionId)
  }
}
