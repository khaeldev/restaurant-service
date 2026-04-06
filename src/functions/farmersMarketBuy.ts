import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda'
import { logger, responseHandler } from '@powertools/utilities'

/**
 * Emulates the external Farmers Market HTTP API: GET ?ingredient=<name> → { quantitySold: number }.
 * Variable “supply” per request (1–8 units), similar to an unpredictable market restock.
 */
function emulateQuantitySold(): number {
  return Math.floor(Math.random() * 8) + 1
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResultV2> => {
  logger.info('farmersMarketBuy invoked', { requestId: event.requestContext?.requestId })

  const raw = event.queryStringParameters?.ingredient
  if (raw === undefined || raw.trim() === '') {
    return responseHandler(400, { message: 'Missing required query parameter: ingredient' })
  }

  const quantitySold = emulateQuantitySold()
  logger.info('farmersMarketBuy response', { ingredient: raw.trim(), quantitySold })

  return responseHandler(200, { quantitySold })
}
