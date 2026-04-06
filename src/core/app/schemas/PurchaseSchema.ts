import { z } from 'zod'
import { VALID_INGREDIENTS } from '../../domain/value-objects/IngredientName'

export const PurchaseHistorySchema = z.object({
  purchaseId: z.string(),
  ingredientName: z.enum(VALID_INGREDIENTS),
  quantityPurchased: z.number().int().positive(),
  purchasedAt: z.string(),
  orderId: z.string().optional()
})

export const PurchaseResponseSchema = z.object({
  purchases: z.array(PurchaseHistorySchema),
  nextCursor: z.string().optional()
})

export type PurchaseHistoryItem = z.infer<typeof PurchaseHistorySchema>
export type PurchaseResponse = z.infer<typeof PurchaseResponseSchema>
