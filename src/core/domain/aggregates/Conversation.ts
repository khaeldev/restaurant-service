import { ulid } from 'ulid'

export type MessageRole = 'user' | 'assistant' | 'system'

export interface ConversationMessage {
  messageId: string
  role: MessageRole
  content: string
  timestamp: string
}

export interface Conversation {
  conversationId: string
  sessionId: string
  messages: ConversationMessage[]
  createdAt: string
  updatedAt: string
  expiresAt: number // TTL for DynamoDB - always required
}

export interface VoiceCommandIntent {
  action: 'CREATE_ORDER' | 'GET_RECOMMENDATIONS' | 'GET_STATUS' | 'GET_INVENTORY' | 'UNKNOWN'
  parameters?: Record<string, unknown>
}

export class ConversationDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConversationDomainError'
  }
}

export function createConversation(sessionId: string): Conversation {
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  return {
    conversationId: ulid(),
    sessionId,
    messages: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: Math.floor(thirtyDaysFromNow.getTime() / 1000) // TTL in seconds
  }
}

export function addMessage(
  conversation: Conversation,
  role: MessageRole,
  content: string
): Conversation {
  const message: ConversationMessage = {
    messageId: ulid(),
    role,
    content,
    timestamp: new Date().toISOString()
  }

  return {
    ...conversation,
    messages: [...conversation.messages, message],
    updatedAt: new Date().toISOString()
  }
}
