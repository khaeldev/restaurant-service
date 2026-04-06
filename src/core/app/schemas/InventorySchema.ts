import { z } from 'zod'
import { VALID_INGREDIENTS } from '../../domain/value-objects/IngredientName'

export const InventoryItemSchema = z.object({
  ingredientName: z.enum(VALID_INGREDIENTS),
  availableQuantity: z.number().int().nonnegative(),
  reservedQuantity: z.number().int().nonnegative(),
  updatedAt: z.string()
})

export const InventoryResponseSchema = z.object({
  inventory: z.array(InventoryItemSchema)
})

export type InventoryItem = z.infer<typeof InventoryItemSchema>
export type InventoryResponse = z.infer<typeof InventoryResponseSchema>
