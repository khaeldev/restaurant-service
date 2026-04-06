import { z } from 'zod'

export const ProcessVoiceCommandSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  audio: z.string().min(1, 'Audio data is required'), // Base64 encoded
  audioFormat: z.enum(['webm', 'wav', 'mp3', 'ogg', 'm4a']).default('webm')
})

export type ProcessVoiceCommandRequest = z.infer<typeof ProcessVoiceCommandSchema>

export const VoiceCommandResponseSchema = z.object({
  conversationId: z.string(),
  userMessage: z.string(),
  assistantMessage: z.string(),
  intent: z.object({
    action: z.enum(['CREATE_ORDER', 'GET_RECOMMENDATIONS', 'GET_STATUS', 'GET_INVENTORY', 'UNKNOWN']),
    parameters: z.object({
      quantity: z.number().optional(),
      ingredientName: z.string().optional(),
      orderId: z.string().optional()
    }).optional()
  }),
  actionResult: z.unknown().optional()
})

export type VoiceCommandResponse = z.infer<typeof VoiceCommandResponseSchema>
