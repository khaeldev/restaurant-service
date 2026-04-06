'use client'

import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import type { Recipe } from '@/lib/types'

interface RecipeGridProps {
  recipes: Recipe[]
  isLoading?: boolean
  error?: Error
}

const recipeIcons: Record<string, string> = {
  'Tomato Salad': '🥗',
  'Grilled Chicken': '🍗',
  'Beef Burger': '🍔',
  'Chicken Rice Bowl': '🍚',
  'Cheese Potato': '🧀',
  'Meat Stew': '🍲'
}

export function RecipeGrid({ recipes, isLoading, error }: RecipeGridProps) {
  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>Failed to load recipes</p>
        <p className="text-sm mt-2">{error.message}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Loading recipes...</p>
      </div>
    )
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No recipes found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <Card key={recipe.recipeId} variant="elevated">
          <CardHeader className="text-center pb-0">
            <div className="text-4xl mb-2">
              {recipeIcons[recipe.name] || '🍽️'}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {recipe.name}
            </h3>
          </CardHeader>

          <CardBody>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Ingredients:
              </h4>
              <ul className="space-y-1">
                {recipe.ingredients.map((ingredient, idx) => (
                  <li key={idx} className="text-sm text-gray-600">
                    <span className="font-medium capitalize">
                      {ingredient.name}
                    </span>
                    <span className="text-gray-500 ml-2">
                      × {ingredient.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}
