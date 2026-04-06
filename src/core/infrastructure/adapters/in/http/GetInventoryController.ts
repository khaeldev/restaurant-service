import { APIGatewayProxyEvent } from 'aws-lambda'
import { IWarehouseRepository } from '@core/domain/services/repositories/IWarehouseRepository'
import { logger } from '@powertools/utilities'

export class GetInventoryController {
  constructor(private readonly warehouseRepository: IWarehouseRepository) {}

  async execute(_event: APIGatewayProxyEvent): Promise<unknown> {
    try {
      logger.info('GetInventoryController: fetching inventory')

      // Get all inventory items
      const inventory = await this.warehouseRepository.getAllInventory()

      logger.info('GetInventoryController: inventory fetched', { count: inventory.length })

      return {
        inventory: inventory.map(item => ({
          ingredientName: item.ingredientName,
          availableQuantity: item.availableQuantity,
          reservedQuantity: item.reservedQuantity,
          updatedAt: item.updatedAt
        }))
      }
    } catch (error) {
      logger.error('GetInventoryController: error', { error })
      throw error
    }
  }
}
