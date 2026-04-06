import { ulid } from 'ulid'
import { IVoiceAIClient, VoiceContext } from '../../domain/services/repositories/IVoiceAIClient'
import { IConversationRepository } from '../../domain/services/repositories/IConversationRepository'
import { IOrderRepository } from '../../domain/services/repositories/IOrderRepository'
import { IRecipeRepository } from '../../domain/services/repositories/IRecipeRepository'
import { IWarehouseRepository } from '../../domain/services/repositories/IWarehouseRepository'
import { IEventPublisher } from '../ports/out/events/IEventPublisher'
import { createConversation, addMessage, VoiceCommandIntent, Conversation } from '../../domain/aggregates/Conversation'
import { createOrder } from '../../domain/aggregates/Order'
import { WarehouseInventory } from '../../domain/aggregates/WarehouseInventory'
import { Recipe } from '../../domain/aggregates/Recipe'
import { Order } from '../../domain/aggregates/Order'
import { logger } from '@powertools/utilities'

export interface ProcessVoiceCommandRequest {
  sessionId: string
  audioBuffer: Buffer
  audioFormat: string
}

export interface ProcessVoiceCommandResponse {
  conversationId: string
  userMessage: string
  assistantMessage: string
  intent: VoiceCommandIntent
  actionResult?: {
    orderId?: string
    recommendations?: string[]
    status?: unknown
    inventory?: unknown
  }
}

export class ProcessVoiceCommandUsecase {
  constructor(
    private readonly voiceAIClient: IVoiceAIClient,
    private readonly conversationRepository: IConversationRepository,
    private readonly orderRepository: IOrderRepository,
    private readonly recipeRepository: IRecipeRepository,
    private readonly warehouseRepository: IWarehouseRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(request: ProcessVoiceCommandRequest): Promise<ProcessVoiceCommandResponse> {
    try {
      logger.info('🎤 Step 1: Starting voice command processing', {
        sessionId: request.sessionId,
        audioFormat: request.audioFormat,
        audioBufferSize: request.audioBuffer.length
      })

      // Step 1: Transcribe audio to text
      const transcription = await this.voiceAIClient.transcribeAudio(
        request.audioBuffer,
        request.audioFormat
      )
      logger.info('✅ Step 1 Complete: Audio transcribed', {
        text: transcription.text,
        language: transcription.language
      })

      // Step 2: Load or create conversation
      logger.info('📋 Step 2: Loading/creating conversation', { sessionId: request.sessionId })
      let conversation = await this.conversationRepository.getConversationBySessionId(request.sessionId)
      if (!conversation) {
        logger.info('📝 Creating new conversation for session')
        conversation = createConversation(request.sessionId)
        await this.conversationRepository.createConversation(conversation)
      }
      logger.info('✅ Step 2 Complete: Conversation loaded', {
        conversationId: conversation.conversationId,
        messageCount: conversation.messages.length
      })

      // Step 3: Build context for LLM
      logger.info('🔍 Step 3: Building LLM context', {})
      const context = await this.buildVoiceContext(conversation)
      logger.info('✅ Step 3 Complete: Context built', {
        inventoryCount: context.inventory.length,
        recipeCount: context.recipes.length,
        recentOrdersCount: context.recentOrders.length,
        historyMessages: context.conversationHistory?.length || 0
      })

      // Step 4: Process command with Claude
      logger.info('🧠 Step 4: Processing with Claude LLM', { userMessage: transcription.text })
      const llmResponse = await this.voiceAIClient.processCommand(transcription.text, context)
      logger.info('✅ Step 4 Complete: Claude processed', {
        intent: llmResponse.intent.action,
        parameters: llmResponse.intent.parameters,
        responseLength: llmResponse.message.length
      })

      // Step 5: Execute action based on intent
      logger.info('⚡ Step 5: Executing action', { action: llmResponse.intent.action })
      const actionResult = await this.executeAction(llmResponse.intent)
      logger.info('✅ Step 5 Complete: Action executed', { actionResult })

      // Step 6: Update conversation history
      logger.info('💾 Step 6: Updating conversation history', {})
      conversation = addMessage(conversation, 'user', transcription.text)
      conversation = addMessage(conversation, 'assistant', llmResponse.message)
      await this.conversationRepository.updateConversation(conversation)
      logger.info('✅ Step 6 Complete: Conversation updated', {
        totalMessages: conversation.messages.length
      })

      logger.info('🎉 Voice command processing complete', {
        conversationId: conversation.conversationId,
        intent: llmResponse.intent.action
      })

      return {
        conversationId: conversation.conversationId,
        userMessage: transcription.text,
        assistantMessage: llmResponse.message,
        intent: llmResponse.intent,
        actionResult
      }
    } catch (error) {
      logger.error('❌ ProcessVoiceCommandUsecase failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      throw new Error(`Failed to process voice command: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async buildVoiceContext(conversation: Conversation): Promise<VoiceContext> {
    // Fetch current system state
    const [inventory, recipes, recentOrders] = await Promise.all([
      this.warehouseRepository.getAllInventory(),
      this.recipeRepository.getAllRecipes(),
      this.orderRepository.listOrders({ status: undefined }, { limit: 10 })
    ])

    return {
      inventory: inventory.map((i: WarehouseInventory) => ({
        ingredientName: i.ingredientName,
        availableQuantity: i.availableQuantity
      })),
      recipes: recipes.map((r: Recipe) => ({
        recipeId: r.recipeId,
        name: r.name,
        ingredients: r.ingredients
      })),
      recentOrders: recentOrders.items.map((o: Order) => ({
        orderId: o.orderId,
        quantity: o.quantity,
        status: o.status,
        createdAt: o.createdAt
      })),
      conversationHistory: conversation.messages.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    }
  }

  private async executeAction(intent: VoiceCommandIntent): Promise<Record<string, unknown>> {
    switch (intent.action) {
      case 'CREATE_ORDER': {
        if (intent.parameters && typeof intent.parameters.quantity === 'number') {
          const orderId = ulid()
          const order = createOrder(orderId, intent.parameters.quantity as number)
          await this.orderRepository.createOrder(order)
          await this.eventPublisher.publishEvent('restaurant.service', 'OrderCreated', {
            orderId: order.orderId,
            quantity: order.quantity,
            status: order.status,
            createdAt: order.createdAt
          })
          logger.info('Order created via voice', { orderId: order.orderId, quantity: order.quantity })
          return { orderId: order.orderId }
        }
        logger.warn('CREATE_ORDER: missing or invalid quantity parameter')
        return { error: 'Missing quantity parameter' }
      }

      case 'GET_RECOMMENDATIONS': {
        const recipes = await this.recipeRepository.getAllRecipes()
        const inventory = await this.warehouseRepository.getAllInventory()

        // Simple recommendation: recipes with available ingredients
        const recommendations = recipes
          .filter((recipe: Recipe) => {
            return recipe.ingredients.every(ing => {
              const stock = inventory.find(i => i.ingredientName === ing.name)
              return stock && stock.availableQuantity >= ing.quantity
            })
          })
          .map(r => r.name)

        logger.info('Recommendations retrieved', { count: recommendations.length, recipes: recommendations })
        return { recommendations }
      }

      case 'GET_STATUS': {
        const orders = await this.orderRepository.listOrders({}, { limit: 20 })
        const statusSummary = {
          pending: orders.items.filter(o => o.status === 'PENDING').length,
          inProgress: orders.items.filter(o => o.status === 'IN_PROGRESS').length,
          completed: orders.items.filter(o => o.status === 'COMPLETED').length
        }
        logger.info('Order status retrieved', statusSummary)
        return { status: statusSummary }
      }

      case 'GET_INVENTORY': {
        const inventory = await this.warehouseRepository.getAllInventory()
        logger.info('Inventory retrieved', { itemCount: inventory.length })
        return { inventory }
      }

      default:
        logger.warn('Unknown action requested', { action: intent.action })
        return { error: 'Unknown action' }
    }
  }
}
