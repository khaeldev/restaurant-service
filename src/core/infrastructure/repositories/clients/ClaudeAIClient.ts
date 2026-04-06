import axios from 'axios'
import { config } from '@config/environment'
import { LLMResponse, VoiceContext } from '@core/domain/services/repositories/IVoiceAIClient'
import { VoiceCommandIntent } from '@core/domain/aggregates/Conversation'
import { logger } from '@powertools/utilities'
import { CircuitBreaker } from '@core/infrastructure/resilience'
import { Bulkhead } from '@core/infrastructure/resilience'

export class ClaudeAIClient {
  private readonly apiKey: string
  private readonly model: string
  private readonly baseUrl = 'https://api.anthropic.com/v1'

  constructor(
    private readonly circuitBreaker: CircuitBreaker,
    private readonly bulkhead: Bulkhead
  ) {
    this.apiKey = config.anthropicApiKey || ''
    this.model = config.claudeModel || 'claude-3-5-sonnet-20241022'

    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured')
    }
  }

  async processCommand(userMessage: string, context: VoiceContext): Promise<LLMResponse> {
    const systemPrompt = this.buildSystemPrompt(context)
    const messages = this.buildMessages(userMessage, context)

    const response = await this.bulkhead.execute(() =>
      this.circuitBreaker.execute(async () => {
        return axios.post(
          `${this.baseUrl}/messages`,
          {
            model: this.model,
            max_tokens: 1024,
            system: systemPrompt,
            messages
          },
          {
            headers: {
              'x-api-key': this.apiKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
            },
            timeout: 30000
          }
        )
      })
    )
    logger.info('LLM response' , {response})

    const assistantMessage = response.data.content[0].text
    const intent = this.extractIntent(assistantMessage, userMessage)

    logger.info('Claude processing successful', {
      userMessage,
      intent: intent.action,
      responseLength: assistantMessage.length
    })

    return {
      message: assistantMessage,
      intent
    }
  }

  private buildSystemPrompt(context: VoiceContext): string {
    return `You are a voice assistant for Restaurant Service, helping users place orders, get recommendations, and check system status.

CURRENT CONTEXT:
- Available recipes: ${context.recipes.map(r => r.name).join(', ')}
- Inventory status: ${context.inventory.map(i => `${i.ingredientName}: ${i.availableQuantity}`).join(', ')}
- Recent orders: ${context.recentOrders.length} orders in progress

CAPABILITIES:
1. CREATE_ORDER: When user wants to place an order (e.g., "I want 5 dishes", "Create an order for 10")
2. GET_RECOMMENDATIONS: When user asks what's available or what to order (e.g., "What can I order?", "Recommend something")
3. GET_STATUS: When user asks about order status (e.g., "What's the status?", "How are my orders?")
4. GET_INVENTORY: When user asks about ingredients (e.g., "What ingredients do we have?", "Check inventory")

INSTRUCTIONS:
- Respond in Spanish, naturally and conversationally
- Be concise (max 2-3 sentences)
- When recommending, base it on available inventory
- When creating orders, confirm the quantity
- For status queries, summarize order states
- Always be helpful and friendly

RESPONSE FORMAT:
Start with [ACTION:CREATE_ORDER] or [ACTION:GET_RECOMMENDATIONS] etc., then your natural response.
Example: "[ACTION:CREATE_ORDER] Perfecto, voy a crear una orden de 5 platos. ¿Está bien?"
`
  }

  private buildMessages(userMessage: string, context: VoiceContext): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = []

    // Add conversation history if available
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      context.conversationHistory.slice(-6).forEach(msg => {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })
      })
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    })

    return messages
  }

  private extractIntent(assistantMessage: string, userMessage: string): VoiceCommandIntent {
    // Try to match [ACTION:...]
    const actionMatch = assistantMessage.match(/\[ACTION:\s*(\w+)\s*\]/i)

    if (actionMatch) {
      const action = actionMatch[1]?.toUpperCase() as VoiceCommandIntent['action']
      const parameters = this.extractParameters(assistantMessage, userMessage)
      return { action, parameters }
    }

    // Fallback: keyword detection in assistant message first
    const lowerAssistantMsg = assistantMessage.toLowerCase()
    if (lowerAssistantMsg.includes('crear') || lowerAssistantMsg.includes('pedir') || lowerAssistantMsg.includes('orden de')) {
      return { action: 'CREATE_ORDER', parameters: this.extractParameters(assistantMessage, userMessage) }
    }
    if (lowerAssistantMsg.includes('recomendar') || lowerAssistantMsg.includes('disponible') || lowerAssistantMsg.includes('puedo pedir')) {
      return { action: 'GET_RECOMMENDATIONS' }
    }
    if (lowerAssistantMsg.includes('estado') || lowerAssistantMsg.includes('progreso') || lowerAssistantMsg.includes('preparación')) {
      return { action: 'GET_STATUS' }
    }
    if (lowerAssistantMsg.includes('inventario') || lowerAssistantMsg.includes('ingredientes')) {
      return { action: 'GET_INVENTORY' }
    }

    // Final fallback: keyword detection in user message
    const lowerUserMsg = userMessage.toLowerCase()
    if (lowerUserMsg.includes('crear') || lowerUserMsg.includes('pedir') || lowerUserMsg.includes('orden')) {
      return { action: 'CREATE_ORDER', parameters: this.extractParameters(assistantMessage, userMessage) }
    }
    if (lowerUserMsg.includes('recomendar') || lowerUserMsg.includes('qué puedo') || lowerUserMsg.includes('disponible')) {
      return { action: 'GET_RECOMMENDATIONS' }
    }
    if (lowerUserMsg.includes('estado') || lowerUserMsg.includes('cómo van') || lowerUserMsg.includes('progreso')) {
      return { action: 'GET_STATUS' }
    }
    if (lowerUserMsg.includes('inventario') || lowerUserMsg.includes('ingredientes')) {
      return { action: 'GET_INVENTORY' }
    }

    return { action: 'UNKNOWN' }
  }

  private extractParameters(assistantMessage: string, userMessage: string): VoiceCommandIntent['parameters'] {
    const parameters: VoiceCommandIntent['parameters'] = {}

    // Extract quantity from message
    const quantityMatch = userMessage.match(/\d+/)
    if (quantityMatch) {
      parameters.quantity = parseInt(quantityMatch[0], 10)
    }

    return parameters
  }
}
