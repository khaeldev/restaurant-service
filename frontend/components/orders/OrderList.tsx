'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrders } from '@/lib/hooks/useOrders'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import type { OrderStatus } from '@/lib/types'

export function OrderList() {
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const router = useRouter()

  const { orders, isLoading, error } = useOrders(filter === 'ALL' ? undefined : filter)

  const handleRowClick = (orderId: string) => {
    router.push(`/orders/${orderId}`)
  }

  if (error) {
    return (
      <Card variant="bordered">
        <CardBody>
          <div className="text-center py-8 text-red-600">
            <p>Failed to load orders</p>
            <p className="text-sm mt-2">{error.message}</p>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card variant="bordered">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Orders in Preparation</h2>
          <div className="flex gap-2">
            <Button
              variant={filter === 'ALL' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('ALL')}
            >
              All
            </Button>
            <Button
              variant={filter === 'PENDING' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('PENDING')}
            >
              Pending
            </Button>
            <Button
              variant={filter === 'IN_PROGRESS' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('IN_PROGRESS')}
            >
              In Progress
            </Button>
            <Button
              variant={filter === 'COMPLETED' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('COMPLETED')}
            >
              Completed
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardBody className="p-0">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No orders found</p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Order ID</TableHeader>
                <TableHeader>Quantity</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Created At</TableHeader>
                <TableHeader>Completed At</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.orderId}
                  onClick={() => handleRowClick(order.orderId)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-mono text-xs">
                    {order.orderId.slice(0, 8)}...
                  </TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>
                    <Badge status={order.status} />
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {new Date(order.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {order.completedAt ? new Date(order.completedAt).toLocaleString() : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardBody>
    </Card>
  )
}
