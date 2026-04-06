'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createOrder } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { toast } from 'sonner'

const createOrderSchema = z.object({
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Quantity cannot exceed 100'),
})

type CreateOrderFormData = z.infer<typeof createOrderSchema>

export default function Home() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: { quantity: 10 },
  })

  const onSubmit = async (data: CreateOrderFormData) => {
    setIsSubmitting(true)
    try {
      const result = await createOrder({ quantity: data.quantity })
      toast.success(`Order created! ID: ${result.orderId.slice(0, 8)}...`)
      reset()

      // Redirect to order detail
      setTimeout(() => {
        router.push(`/orders/${result.orderId}`)
      }, 500)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create order'
      toast.error(message)
      console.error('Error creating order:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Welcome to Restaurant Service
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Automated dish preparation and inventory management system for efficient
          order fulfillment at scale.
        </p>
      </section>

      {/* Create Order Section */}
      <section className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <Card variant="elevated">
            <CardHeader>
              <h2 className="text-2xl font-bold text-gray-900">Create New Order</h2>
              <p className="text-gray-600 text-sm mt-2">
                Specify the quantity of dishes to prepare
              </p>
            </CardHeader>

            <CardBody>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Dishes (1-100)
                  </label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      {...register('quantity', { valueAsNumber: true })}
                      className="flex-1"
                      placeholder="Enter quantity"
                    />
                  </div>
                  {errors.quantity && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.quantity.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  isLoading={isSubmitting}
                  className="w-full"
                >
                  Create Order
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  💡 Each order will be automatically assigned random recipes from our
                  6 available dishes. Ingredients will be sourced from the warehouse or
                  purchased from the farmers market as needed.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Info Section */}
        <div className="space-y-6">
          <Card variant="elevated">
            <CardHeader>
              <h3 className="text-xl font-bold text-gray-900">How It Works</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                      <span className="text-blue-600 font-bold">1</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Submit Order</h4>
                    <p className="text-sm text-gray-600">
                      You specify how many dishes to prepare
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                      <span className="text-blue-600 font-bold">2</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Select Recipes</h4>
                    <p className="text-sm text-gray-600">
                      System randomly selects from 6 available recipes
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                      <span className="text-blue-600 font-bold">3</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Source Ingredients</h4>
                    <p className="text-sm text-gray-600">
                      Warehouse fulfills requests or buys from farmers market
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                      <span className="text-blue-600 font-bold">4</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Prepare Dishes</h4>
                    <p className="text-sm text-gray-600">
                      Once all ingredients are available, dishes are prepared
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <h3 className="text-xl font-bold text-gray-900">Available Actions</h3>
            </CardHeader>
            <CardBody>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  <a
                    href="/orders"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    View Orders
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">🏪</span>
                  <a
                    href="/inventory"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Check Inventory
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">🛒</span>
                  <a
                    href="/purchases"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Purchase History
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">📖</span>
                  <a
                    href="/recipes"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    View Recipes
                  </a>
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </section>
    </div>
  )
}
