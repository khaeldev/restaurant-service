import { OrderStatus } from '../value-objects/OrderStatus'

export interface Order {
  orderId: string
  quantity: number
  status: OrderStatus
  createdAt: string
  completedAt?: string
}

export class OrderDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OrderDomainError'
  }
}

export function createOrder(orderId: string, quantity: number): Order {
  if (quantity <= 0) {
    throw new OrderDomainError('Order quantity must be greater than 0')
  }

  if (quantity > 100) {
    throw new OrderDomainError('Order quantity cannot exceed 100')
  }

  return {
    orderId,
    quantity,
    status: OrderStatus.PENDING,
    createdAt: new Date().toISOString()
  }
}

export function completeOrder(order: Order): Order {
  if (order.status === OrderStatus.COMPLETED) {
    throw new OrderDomainError('Order is already completed')
  }

  return {
    ...order,
    status: OrderStatus.COMPLETED,
    completedAt: new Date().toISOString()
  }
}

export function updateOrderStatus(order: Order, status: OrderStatus): Order {
  return {
    ...order,
    status
  }
}
