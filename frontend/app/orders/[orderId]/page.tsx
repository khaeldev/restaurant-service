'use client'

import { useRouter } from 'next/navigation'
import { useOrderDetail } from '@/lib/hooks/useOrders'
import { DishList } from '@/components/orders/DishList'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'

interface OrderDetailPageProps {
  params: {
    orderId: string
  }
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const router = useRouter()
  const { order, dishes, isLoading, error } = useOrderDetail(params.orderId)

  if (error) {
    return (
      <div className="space-y-8">
        <Button variant="outline" onClick={() => router.back()}>
          Back to Orders
        </Button>
        <Card variant="bordered">
          <CardBody>
            <div className="text-center py-12 text-red-600">
              <p>Failed to load order details</p>
              <p className="text-sm mt-2">{error.message}</p>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  if (isLoading || !order) {
    return (
      <div className="space-y-8">
        <Button variant="outline" onClick={() => router.back()}>
          Back to Orders
        </Button>
        <Card variant="bordered">
          <CardBody>
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading order details...</p>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
          <p className="text-gray-600 mt-2">
            View order information and dish preparation status
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Back to Orders
        </Button>
      </div>

      {/* Order Summary Card */}
      <Card variant="elevated">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Order Information</h2>
        </CardHeader>

        <CardBody>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Order ID</p>
                  <p className="text-lg font-mono text-gray-900 break-all">
                    {order.orderId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Quantity</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {order.quantity} dishes
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Status</p>
                  <div className="mt-1">
                    <Badge status={order.status} />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Created At</p>
                  <p className="text-lg text-gray-900">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                {order.completedAt && (
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Completed At</p>
                    <p className="text-lg text-gray-900">
                      {new Date(order.completedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Dishes List */}
      <DishList dishes={dishes} isLoading={isLoading} />

      {/* Progress Overview */}
      {dishes.length > 0 && (
        <Card variant="bordered">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Progress Overview</h3>
          </CardHeader>

          <CardBody>
            <div className="space-y-4">
              {(() => {
                const statuses = {
                  WAITING_INGREDIENTS: dishes.filter(
                    (d) => d.status === 'WAITING_INGREDIENTS'
                  ).length,
                  PREPARING: dishes.filter((d) => d.status === 'PREPARING').length,
                  PREPARED: dishes.filter((d) => d.status === 'PREPARED').length,
                  FAILED: dishes.filter((d) => d.status === 'FAILED').length,
                }

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-600">●</span>
                        <span className="text-gray-700">Waiting Ingredients</span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {statuses.WAITING_INGREDIENTS}/{dishes.length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(statuses.WAITING_INGREDIENTS / dishes.length) * 100}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600">●</span>
                        <span className="text-gray-700">Preparing</span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {statuses.PREPARING}/{dishes.length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(statuses.PREPARING / dishes.length) * 100}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">●</span>
                        <span className="text-gray-700">Prepared</span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {statuses.PREPARED}/{dishes.length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(statuses.PREPARED / dishes.length) * 100}%`,
                        }}
                      />
                    </div>

                    {statuses.FAILED > 0 && (
                      <>
                        <div className="flex items-center justify-between pt-4">
                          <div className="flex items-center gap-2">
                            <span className="text-red-600">●</span>
                            <span className="text-gray-700">Failed</span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {statuses.FAILED}/{dishes.length}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${(statuses.FAILED / dishes.length) * 100}%`,
                            }}
                          />
                        </div>
                      </>
                    )}
                  </>
                )
              })()}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
