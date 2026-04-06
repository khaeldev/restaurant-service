'use client'

import { OrderList } from '@/components/orders/OrderList'

export default function OrdersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Monitor and track all orders in real-time. The list automatically refreshes
          for in-progress orders.
        </p>
      </div>

      <OrderList />
    </div>
  )
}
