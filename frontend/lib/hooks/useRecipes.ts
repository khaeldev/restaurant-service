import useSWR from 'swr'
import { getRecipes } from '../api'
import type { RecipesResponse } from '../types'

/**
 * Hook to fetch available recipes
 */
export function useRecipes() {
  const { data, error, isLoading } = useSWR<RecipesResponse>(
    '/recipes',
    getRecipes,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000 // Recipes don't change often
    }
  )

  return {
    recipes: data?.recipes || [],
    isLoading,
    error
  }
}
