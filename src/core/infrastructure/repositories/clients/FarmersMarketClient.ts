import { IFarmersMarketClient, FarmersMarketResponse } from '@core/domain/services/repositories/IFarmersMarketClient'
import { IngredientName } from '@core/domain/value-objects/IngredientName'
import { config } from '@config/environment'
import { logger } from '@powertools/utilities'

export class FarmersMarketClient implements IFarmersMarketClient {
  private readonly baseUrl: string

  constructor() {
    this.baseUrl = config.farmersMarketApiUrl || 'https://example.com/api/farmers-market/buy'
  }

  async buyIngredient(ingredientName: IngredientName): Promise<FarmersMarketResponse> {
    const url = `${this.baseUrl}?ingredient=${ingredientName}`

    try {
      logger.info('FarmersMarketClient: requesting ingredient', { ingredient: ingredientName })
      
      logger.debug('FarmersMarketClient: url', { url })
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Farmers Market API returned status ${response.status}`)
      }

      const data = await response.json() as FarmersMarketResponse

      logger.info('FarmersMarketClient: received response', {
        ingredient: ingredientName,
        quantitySold: data.quantitySold
      })

      return data
    } catch (error) {
      logger.error('FarmersMarketClient: request failed', {
        error,
        ingredient: ingredientName
      })
      throw error
    }
  }
}
