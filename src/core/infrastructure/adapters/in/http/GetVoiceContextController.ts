import { APIGatewayProxyEvent } from 'aws-lambda'
import { GetVoiceContextUsecase } from '@core/app/usecases/GetVoiceContextUsecase'
import { logger } from '@powertools/utilities'

export class GetVoiceContextController {
  constructor(private readonly getVoiceContextUsecase: GetVoiceContextUsecase) {}

  async execute(_event: APIGatewayProxyEvent): Promise<unknown> {
    try {
      logger.info('GetVoiceContextController: fetching context')

      const context = await this.getVoiceContextUsecase.execute()

      return context
    } catch (error) {
      logger.error('GetVoiceContextController: error', { error })
      throw error
    }
  }
}
