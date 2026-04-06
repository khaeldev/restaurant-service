import { PurchaseHistory } from '../../aggregates/PurchaseHistory'
import { Pagination, PaginatedResult } from './IOrderRepository'

export interface IPurchaseRepository {
  recordPurchase(purchase: PurchaseHistory): Promise<void>
  listPurchases(pagination: Pagination): Promise<PaginatedResult<PurchaseHistory>>
}
