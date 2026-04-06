'use client'

import { useRecipes } from '@/lib/hooks/useRecipes'
import { RecipeGrid } from '@/components/recipes/RecipeGrid'

export default function RecipesPage() {
  const { recipes, isLoading, error } = useRecipes()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Available Recipes</h1>
        <p className="text-gray-600 mt-2">
          The 6 recipes available for this event. Orders will randomly select from these
          recipes to ensure variety.
        </p>
      </div>

      <RecipeGrid recipes={recipes} isLoading={isLoading} error={error} />
    </div>
  )
}
