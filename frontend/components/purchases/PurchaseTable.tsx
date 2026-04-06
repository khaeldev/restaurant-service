'use client'

import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import type { Purchase } from '@/lib/types'

interface PurchaseTableProps {
  purchases: Purchase[]
  isLoading?: boolean
  error?: Error
}

export function PurchaseTable({ purchases, isLoading, error }: PurchaseTableProps) {
  if (error) {
    return (
      <Card variant="bordered">
        <CardBody>
          <div className="text-center py-8 text-red-600">
            <p>Failed to load purchases</p>
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
            <p className="mt-4 text-gray-600">Loading purchases...</p>
          </div>
        </CardBody>
      </Card>
    )
  }

  if (purchases.length === 0) {
    return (
      <Card variant="bordered">
        <CardBody>
          <div className="text-center py-8 text-gray-500">
            <p>No purchase history found</p>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card variant="bordered">
      <CardHeader>
        <h2 className="text-xl font-semibold text-gray-900">Purchase History</h2>
        <p className="text-sm text-gray-600 mt-1">Purchases from farmers market</p>
      </CardHeader>

      <CardBody className="p-0">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Purchase ID</TableHeader>
              <TableHeader>Ingredient</TableHeader>
              <TableHeader>Quantity</TableHeader>
              <TableHeader>Purchased At</TableHeader>
              <TableHeader>Related Order</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {purchases.map((purchase) => (
              <TableRow key={purchase.purchaseId}>
                <TableCell className="font-mono text-xs">
                  {purchase.purchaseId.slice(0, 8)}...
                </TableCell>
                <TableCell className="font-medium capitalize">
                  {purchase.ingredientName}
                </TableCell>
                <TableCell>
                  <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-sm font-medium">
                    {purchase.quantityPurchased}
                  </span>
                </TableCell>
                <TableCell className="text-gray-600 text-sm">
                  {new Date(purchase.purchasedAt).toLocaleString()}
                </TableCell>
                <TableCell className="font-mono text-xs text-gray-600">
                  {purchase.orderId ? purchase.orderId.slice(0, 8) + '...' : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  )
}
