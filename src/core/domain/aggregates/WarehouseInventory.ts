import { IngredientName } from '../value-objects/IngredientName'

export interface WarehouseInventory {
  ingredientName: IngredientName
  availableQuantity: number
  reservedQuantity: number
  updatedAt: string
}

export class WarehouseInventoryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WarehouseInventoryError'
  }
}

export function createInventoryItem(ingredientName: IngredientName, initialQuantity: number): WarehouseInventory {
  if (initialQuantity < 0) {
    throw new WarehouseInventoryError('Initial quantity cannot be negative')
  }

  return {
    ingredientName,
    availableQuantity: initialQuantity,
    reservedQuantity: 0,
    updatedAt: new Date().toISOString()
  }
}

export function addStock(inventory: WarehouseInventory, quantity: number): WarehouseInventory {
  if (quantity <= 0) {
    throw new WarehouseInventoryError('Quantity to add must be positive')
  }

  return {
    ...inventory,
    availableQuantity: inventory.availableQuantity + quantity,
    updatedAt: new Date().toISOString()
  }
}

export function deductStock(inventory: WarehouseInventory, quantity: number): WarehouseInventory {
  if (quantity <= 0) {
    throw new WarehouseInventoryError('Quantity to deduct must be positive')
  }

  if (inventory.availableQuantity < quantity) {
    throw new WarehouseInventoryError(
      `Insufficient inventory for ${inventory.ingredientName}. Available: ${inventory.availableQuantity}, Required: ${quantity}`
    )
  }

  return {
    ...inventory,
    availableQuantity: inventory.availableQuantity - quantity,
    updatedAt: new Date().toISOString()
  }
}

export function hasEnoughStock(inventory: WarehouseInventory, requiredQuantity: number): boolean {
  return inventory.availableQuantity >= requiredQuantity
}
