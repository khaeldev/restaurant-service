import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda'
import { GetRecipesController } from '@core/infrastructure/adapters/in/http/GetRecipesController'
import { DynamoRecipeRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoRecipeRepository'
import { logger, responseHandler } from '@powertools/utilities'

// Composition Root
const recipeRepository = new DynamoRecipeRepository()
const controller = new GetRecipesController(recipeRepository)

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    logger.info('getRecipes handler invoked', { requestId: event.requestContext?.requestId })

    const result = await controller.execute(event)

    return responseHandler(200, result)
  } catch (error) {
    logger.error('getRecipes handler failed', { error })
    return responseHandler(500, null, error)
  }
}
