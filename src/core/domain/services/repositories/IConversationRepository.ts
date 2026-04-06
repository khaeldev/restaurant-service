import { Conversation } from '../../aggregates/Conversation'

export interface IConversationRepository {
  createConversation(conversation: Conversation): Promise<void>
  getConversationBySessionId(sessionId: string): Promise<Conversation | null>
  updateConversation(conversation: Conversation): Promise<void>
  deleteConversation(conversationId: string): Promise<void>
}
