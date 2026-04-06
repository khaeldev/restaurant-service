import { APIGatewayProxyEvent } from 'aws-lambda'
import { LoginRequestSchema } from '@core/app/schemas/AuthSchema'
import { LoginUsecase } from '@core/app/usecases/LoginUsecase'
import { logger } from '@powertools/utilities'

export class LoginController {
  constructor(private readonly loginUsecase: LoginUsecase) {}

  async execute(event: APIGatewayProxyEvent): Promise<unknown> {
    try {
      const body = event.body ? JSON.parse(event.body) : {}
      const validatedInput = LoginRequestSchema.parse(body)

      logger.info('🔐 Login controller: processing login request', {
        email: validatedInput.email
      })

      // Get client IP for logging
      const ipAddress = event.headers['x-forwarded-for']?.split(',')[0] || event.requestContext?.http?.sourceIp

      const result = await this.loginUsecase.execute({
        email: validatedInput.email,
        password: validatedInput.password,
        ipAddress
      })

      logger.info('✅ Login controller: login successful', {
        userId: result.userId,
        email: result.email
      })

      return result
    } catch (error) {
      logger.error('❌ Login controller: error', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }
}
