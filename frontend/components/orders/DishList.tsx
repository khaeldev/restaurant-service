'use client'

import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import type { Dish } from '@/lib/types'

interface DishListProps {
  dishes: Dish[]
  isLoading?: boolean
}

export function DishList({ dishes, isLoading }: DishListProps) {
  if (isLoading) {
    return (
      <Card variant="bordered">
        <CardBody>
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading dishes...</p>
          </div>
        </CardBody>
      </Card>
    )
  }

  if (dishes.length === 0) {
    return (
      <Card variant="bordered">
        <CardBody>
          <div className="text-center py-8 text-gray-500">
            <p>No dishes found</p>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card variant="bordered">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Dishes</h3>
      </CardHeader>

      <CardBody className="p-0">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Dish ID</TableHeader>
              <TableHeader>Recipe</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Ingredients</TableHeader>
              <TableHeader>Prepared At</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {dishes.map((dish) => (
              <TableRow key={dish.dishId}>
                <TableCell className="font-mono text-xs">
                  {dish.dishId}
                </TableCell>
                <TableCell className="font-medium">{dish.recipeName}</TableCell>
                <TableCell>
                  <Badge status={dish.status} />
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600">
                    {dish.ingredients.map((ing, idx) => (
                      <span key={idx}>
                        {ing.name} ({ing.quantity})
                        {idx < dish.ingredients.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">
                  {dish.preparedAt ? new Date(dish.preparedAt).toLocaleString() : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  )
}
