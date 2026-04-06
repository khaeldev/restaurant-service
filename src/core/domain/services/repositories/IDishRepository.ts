import { Dish } from '../../aggregates/Dish'
import { DishStatus } from '../../value-objects/DishStatus'

export interface IDishRepository {
  createDish(dish: Dish): Promise<void>
  getDish(orderId: string, dishId: string): Promise<Dish | null>
  updateDishStatus(orderId: string, dishId: string, status: DishStatus, preparedAt?: string): Promise<void>
  listDishesByOrder(orderId: string): Promise<Dish[]>
  countDishesByOrderAndStatus(orderId: string, status: DishStatus): Promise<number>
}
