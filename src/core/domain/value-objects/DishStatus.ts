export enum DishStatus {
  WAITING_INGREDIENTS = 'WAITING_INGREDIENTS',
  PREPARING = 'PREPARING',
  PREPARED = 'PREPARED',
  FAILED = 'FAILED'
}

export function isValidDishStatus(status: string): status is DishStatus {
  return Object.values(DishStatus).includes(status as DishStatus)
}
