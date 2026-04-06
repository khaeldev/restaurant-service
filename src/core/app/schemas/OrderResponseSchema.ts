import { z } from 'zod'
import { OrderStatus } from '../../domain/value-objects/OrderStatus'
import { DishStatus } from '../../domain/value-objects/DishStatus'

export const IngredientRequirementSchema = z.object({
  name: z.string(),
  quantity: z.number()
})

export const DishResponseSchema = z.object({
  dishId: z.string(),
  orderId: z.string(),
  recipeId: z.string(),
  recipeName: z.string(),
  status: z.nativeEnum(DishStatus),
  ingredients: z.array(IngredientRequirementSchema),
  preparedAt: z.string().optional()
})

export const OrderResponseSchema = z.object({
  orderId: z.string(),
  quantity: z.number(),
  status: z.nativeEnum(OrderStatus),
  createdAt: z.string(),
  completedAt: z.string().optional()
})

export const OrderDetailResponseSchema = z.object({
  order: OrderResponseSchema,
  dishes: z.array(DishResponseSchema)
})

export type OrderResponse = z.infer<typeof OrderResponseSchema>
export type DishResponse = z.infer<typeof DishResponseSchema>
export type OrderDetailResponse = z.infer<typeof OrderDetailResponseSchema>
