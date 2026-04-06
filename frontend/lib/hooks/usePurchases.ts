import useSWR from 'swr'
import { getPurchases } from '../api'
import type { PurchasesResponse } from '../types'

/**
 * Hook to fetch purchase history
 */
export function usePurchases() {
  const { data, error, isLoading, mutate } = useSWR<PurchasesResponse>(
    '/purchases',
    () => getPurchases({ limit: 50 }),
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000
    }
  )

  return {
    purchases: data?.purchases || [],
    nextCursor: data?.nextCursor,
    isLoading,
    error,
    mutate
  }
}
