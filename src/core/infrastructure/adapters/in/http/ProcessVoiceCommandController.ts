import { APIGatewayProxyEvent } from 'aws-lambda'
import { ProcessVoiceCommandSchema } from '@core/app/schemas/VoiceCommandSchema'
import { ProcessVoiceCommandUsecase } from '@core/app/usecases/ProcessVoiceCommandUsecase'
import { logger } from '@powertools/utilities'

export class ProcessVoiceCommandController {
  constructor(private readonly processVoiceCommandUsecase: ProcessVoiceCommandUsecase) {}

  async execute(event: APIGatewayProxyEvent): Promise<unknown> {
    try {
      const body = event.body ? JSON.parse(event.body) : {}
      const validatedInput = ProcessVoiceCommandSchema.parse(body)

      logger.info('ProcessVoiceCommandController: validated input', {
        sessionId: validatedInput.sessionId,
        audioFormat: validatedInput.audioFormat
      })

      // Decode base64 audio to buffer
      const audioBuffer = Buffer.from(validatedInput.audio, 'base64')

      const result = await this.processVoiceCommandUsecase.execute({
        sessionId: validatedInput.sessionId,
        audioBuffer,
        audioFormat: validatedInput.audioFormat
      })

      logger.info('ProcessVoiceCommandController: command processed', {
        conversationId: result.conversationId,
        intent: result.intent.action
      })

      return result
    } catch (error) {
      logger.error('ProcessVoiceCommandController: error', { error })
      throw error
    }
  }
}
