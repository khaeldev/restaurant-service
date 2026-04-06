'use client'

import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import type { InventoryItem } from '@/lib/types'

interface InventoryTableProps {
  inventory: InventoryItem[]
  isLoading?: boolean
  error?: Error
}

function getQuantityVariant(quantity: number): 'error' | 'warning' | 'success' {
  if (quantity < 5) return 'error'
  if (quantity < 10) return 'warning'
  return 'success'
}

function getQuantityLabel(quantity: number): string {
  if (quantity < 5) return 'Critical'
  if (quantity < 10) return 'Low'
  return 'Adequate'
}

export function InventoryTable({ inventory, isLoading, error }: InventoryTableProps) {
  if (error) {
    return (
      <Card variant="bordered">
        <CardBody>
          <div className="text-center py-8 text-red-600">
            <p>Failed to load inventory</p>
            <p className="text-sm mt-2">{error.message}</p>
          </div>
        </CardBody>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card variant="bordered">
        <CardBody>
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading inventory...</p>
          </div>
        </CardBody>
      </Card>
    )
  }

  if (inventory.length === 0) {
    return (
      <Card variant="bordered">
        <CardBody>
          <div className="text-center py-8 text-gray-500">
            <p>No inventory items found</p>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card variant="bordered">
      <CardHeader>
        <h2 className="text-xl font-semibold text-gray-900">Warehouse Inventory</h2>
        <p className="text-sm text-gray-600 mt-1">Auto-refresh every 10 seconds</p>
      </CardHeader>

      <CardBody className="p-0">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Ingredient</TableHeader>
              <TableHeader>Available Quantity</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Last Updated</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.ingredientName}>
                <TableCell className="font-medium capitalize">
                  {item.ingredientName}
                </TableCell>
                <TableCell>
                  <span className="text-lg font-semibold">
                    {item.availableQuantity}
                  </span>
                  <span className="text-gray-500 ml-2">units</span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getQuantityVariant(item.availableQuantity)}
                  >
                    {getQuantityLabel(item.availableQuantity)}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600 text-sm">
                  {new Date(item.updatedAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  )
}
