import useSWR from 'swr'
import { getInventory } from '../api'
import type { InventoryResponse } from '../types'

/**
 * Hook to fetch warehouse inventory
 * Auto-refreshes every 10 seconds
 */
export function useInventory() {
  const { data, error, isLoading, mutate } = useSWR<InventoryResponse>(
    '/inventory',
    getInventory,
    {
      refreshInterval: 10000, // Poll every 10s
      revalidateOnFocus: true,
      dedupingInterval: 2000
    }
  )

  return {
    inventory: data?.inventory || [],
    isLoading,
    error,
    mutate
  }
}
