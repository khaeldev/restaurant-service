import { VoiceCommandIntent } from '../../aggregates/Conversation'

export interface TranscriptionResult {
  text: string
  language?: string
  confidence?: number
}

export interface LLMResponse {
  message: string
  intent: VoiceCommandIntent
  confidence?: number
}

export interface VoiceContext {
  inventory: Array<{ ingredientName: string; availableQuantity: number }>
  recipes: Array<{ recipeId: string; name: string; ingredients: Array<{ name: string; quantity: number }> }>
  recentOrders: Array<{ orderId: string; quantity: number; status: string; createdAt: string }>
  conversationHistory?: Array<{ role: string; content: string }>
}

export interface IVoiceAIClient {
  transcribeAudio(audioBuffer: Buffer, format: string): Promise<TranscriptionResult>
  processCommand(userMessage: string, context: VoiceContext): Promise<LLMResponse>
}
