import { z } from 'zod'

export const CreateOrderSchema = z.object({
  quantity: z.number()
    .int('Quantity must be an integer')
    .positive('Quantity must be positive')
    .max(100, 'Quantity cannot exceed 100')
})

export type CreateOrderRequest = z.infer<typeof CreateOrderSchema>
