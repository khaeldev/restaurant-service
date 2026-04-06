import useSWR from 'swr'
import { getOrders, getOrderById } from '../api'
import type { OrdersResponse, OrderDetailResponse } from '../types'

/**
 * Hook to fetch all orders with optional filters
 * Includes auto-refresh for in-progress orders
 */
export function useOrders(status?: string) {
  const { data, error, isLoading, mutate } = useSWR<OrdersResponse>(
    status ? `/orders?status=${status}` : '/orders',
    () => getOrders(status ? { status } : undefined),
    {
      refreshInterval: status === 'IN_PROGRESS' ? 5000 : 0, // Poll every 5s for in-progress
      revalidateOnFocus: true,
      dedupingInterval: 2000
    }
  )

  return {
    orders: data?.orders || [],
    nextCursor: data?.nextCursor,
    isLoading,
    error,
    mutate
  }
}

/**
 * Hook to fetch order detail by ID
 */
export function useOrderDetail(orderId: string) {
  const { data, error, isLoading, mutate } = useSWR<OrderDetailResponse>(
    orderId ? `/orders/${orderId}` : null,
    () => getOrderById(orderId),
    {
      refreshInterval: 5000, // Poll every 5s to track dish preparation
      revalidateOnFocus: true
    }
  )

  return {
    order: data?.order,
    dishes: data?.dishes || [],
    isLoading,
    error,
    mutate
  }
}
