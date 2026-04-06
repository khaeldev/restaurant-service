import { Order } from '../../aggregates/Order'
import { OrderStatus } from '../../value-objects/OrderStatus'

export interface Pagination {
  limit?: number
  cursor?: string
}

export interface PaginatedResult<T> {
  items: T[]
  nextCursor?: string
}

export interface IOrderRepository {
  createOrder(order: Order): Promise<void>
  getOrderById(orderId: string): Promise<Order | null>
  updateOrderStatus(orderId: string, status: OrderStatus): Promise<void>
  listOrders(filters: { status?: OrderStatus }, pagination: Pagination): Promise<PaginatedResult<Order>>
}
