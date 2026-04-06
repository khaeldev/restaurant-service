import axios, { AxiosInstance } from 'axios'
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  OrdersResponse,
  OrderDetailResponse,
  InventoryResponse,
  PurchasesResponse,
  RecipesResponse,
  ProcessVoiceCommandRequest,
  ProcessVoiceCommandResponse,
  ConversationHistoryResponse,
  VoiceContextData
} from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add request interceptor to include JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401, redirect to login
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        localStorage.removeItem('email')
        window.location.href = '/login'
      }
    }
    console.error('API Error:', error.response?.data || error.message)
    throw error
  }
)

// API Functions

/**
 * Create a new order
 */
export async function createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
  const response = await apiClient.post<CreateOrderResponse>('/orders', data)
  return response.data
}

/**
 * Get all orders with optional filters and pagination
 */
export async function getOrders(params?: {
  status?: string
  limit?: number
  cursor?: string
}): Promise<OrdersResponse> {
  const response = await apiClient.get<OrdersResponse>('/orders', { params })
  return response.data
}

/**
 * Get order detail by ID
 */
export async function getOrderById(orderId: string): Promise<OrderDetailResponse> {
  const response = await apiClient.get<OrderDetailResponse>(`/orders/${orderId}`)
  return response.data
}

/**
 * Get warehouse inventory
 */
export async function getInventory(): Promise<InventoryResponse> {
  const response = await apiClient.get<InventoryResponse>('/inventory')
  return response.data
}

/**
 * Get purchase history
 */
export async function getPurchases(params?: {
  limit?: number
  cursor?: string
}): Promise<PurchasesResponse> {
  const response = await apiClient.get<PurchasesResponse>('/purchases', { params })
  return response.data
}

/**
 * Get available recipes
 */
export async function getRecipes(): Promise<RecipesResponse> {
  const response = await apiClient.get<RecipesResponse>('/recipes')
  return response.data
}

// Voice Assistant API Functions

/**
 * Process voice command
 */
export async function processVoiceCommand(data: ProcessVoiceCommandRequest): Promise<ProcessVoiceCommandResponse> {
  const response = await apiClient.post<ProcessVoiceCommandResponse>('/voice/process', data)
  return response.data
}

/**
 * Get conversation history by session ID
 */
export async function getConversationHistory(sessionId: string): Promise<ConversationHistoryResponse> {
  const response = await apiClient.get<ConversationHistoryResponse>(`/voice/conversations/${sessionId}`)
  return response.data
}

/**
 * Get voice context (current system state)
 */
export async function getVoiceContext(): Promise<VoiceContextData> {
  const response = await apiClient.get<VoiceContextData>('/voice/context')
  return response.data
}

export default apiClient
