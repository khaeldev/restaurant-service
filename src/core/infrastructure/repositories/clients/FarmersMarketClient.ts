import { IFarmersMarketClient, FarmersMarketResponse } from '@core/domain/services/repositories/IFarmersMarketClient'
import { IngredientName } from '@core/domain/value-objects/IngredientName'
import { config } from '@config/environment'
import { logger } from '@powertools/utilities'
import { CircuitBreaker } from '@core/infrastructure/resilience'
import { Bulkhead } from '@core/infrastructure/resilience'

export class FarmersMarketClient implements IFarmersMarketClient {
  private readonly baseUrl: string

  constructor(
    private readonly circuitBreaker: CircuitBreaker,
    private readonly bulkhead: Bulkhead
  ) {
    this.baseUrl = config.farmersMarketApiUrl || 'https://example.com/api/farmers-market/buy'
  }

  async buyIngredient(ingredientName: IngredientName): Promise<FarmersMarketResponse> {
    const url = `${this.baseUrl}?ingredient=${ingredientName}`

    logger.info('FarmersMarketClient: requesting ingredient', { ingredient: ingredientName })

    return this.bulkhead.execute(() =>
      this.circuitBreaker.execute(async () => {
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
      })
    )
  }
}
