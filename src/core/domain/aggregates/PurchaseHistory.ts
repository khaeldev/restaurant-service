import { IngredientName } from '../value-objects/IngredientName'

export interface PurchaseHistory {
  purchaseId: string
  ingredientName: IngredientName
  quantityPurchased: number
  purchasedAt: string
  orderId?: string
}

export class PurchaseHistoryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PurchaseHistoryError'
  }
}

export function createPurchaseRecord(
  purchaseId: string,
  ingredientName: IngredientName,
  quantityPurchased: number,
  orderId?: string
): PurchaseHistory {
  if (quantityPurchased <= 0) {
    throw new PurchaseHistoryError('Purchase quantity must be positive')
  }

  return {
    purchaseId,
    ingredientName,
    quantityPurchased,
    purchasedAt: new Date().toISOString(),
    orderId
  }
}
