// Order Types
export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

export interface Order {
  orderId: string
  quantity: number
  status: OrderStatus
  createdAt: string
  completedAt?: string
}

// Dish Types
export type DishStatus = 'WAITING_INGREDIENTS' | 'PREPARING' | 'PREPARED' | 'FAILED'

export interface Ingredient {
  name: string
  quantity: number
}

export interface Dish {
  dishId: string
  orderId: string
  recipeId: string
  recipeName: string
  status: DishStatus
  ingredients: Ingredient[]
  preparedAt?: string
}

// Recipe Types
export interface Recipe {
  recipeId: string
  name: string
  ingredients: Ingredient[]
}

// Inventory Types
export interface InventoryItem {
  ingredientName: string
  availableQuantity: number
  updatedAt: string
}

// Purchase Types
export interface Purchase {
  purchaseId: string
  ingredientName: string
  quantityPurchased: number
  purchasedAt: string
  orderId?: string
}

// API Response Types
export interface OrdersResponse {
  orders: Order[]
  nextCursor?: string
}

export interface OrderDetailResponse {
  order: Order
  dishes: Dish[]
}

export interface InventoryResponse {
  inventory: InventoryItem[]
}

export interface PurchasesResponse {
  purchases: Purchase[]
  nextCursor?: string
}

export interface RecipesResponse {
  recipes: Recipe[]
}

export interface CreateOrderRequest {
  quantity: number
}

export interface CreateOrderResponse {
  orderId: string
  quantity: number
  status: OrderStatus
  createdAt: string
}

// Voice Assistant Types
export type VoiceAssistantState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'

export interface VoiceMessage {
  messageId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface VoiceCommandIntent {
  action: 'CREATE_ORDER' | 'GET_RECOMMENDATIONS' | 'GET_STATUS' | 'GET_INVENTORY' | 'UNKNOWN'
  parameters?: {
    quantity?: number
    ingredientName?: string
    orderId?: string
  }
}

export interface ProcessVoiceCommandRequest {
  sessionId: string
  audio: string // Base64 encoded
  audioFormat: 'webm' | 'wav' | 'mp3' | 'ogg' | 'm4a'
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

export interface ConversationHistoryResponse {
  conversation: {
    conversationId: string
    sessionId: string
    createdAt: string
    updatedAt: string
  } | null
  messages: VoiceMessage[]
}

export interface VoiceContextData {
  inventory: Array<{ ingredientName: string; availableQuantity: number }>
  recipes: Array<{ recipeId: string; name: string; ingredients: Array<{ name: string; quantity: number }> }>
  recentOrders: Array<{ orderId: string; quantity: number; status: string; createdAt: string }>
}
