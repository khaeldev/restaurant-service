import { Logger } from '@aws-lambda-powertools/logger'
import { Tracer } from '@aws-lambda-powertools/tracer'

const logger = new Logger({
  logLevel: 'DEBUG',
  serviceName: 'restaurant-service'
})

// const metrics = new Metrics({
//   defaultDimensions: {
//     aws_account_id: process.env.AWS_ACCOUNT_ID || 'N/A',
//     aws_region: process.env.AWS_REGION || 'N/A',
//   }
// })

const tracer = new Tracer()

export class GenerateError extends Error {
  name: 'Error'
  public statusCode: number
  public body: Record<string, unknown> | string
  
  constructor (statusCode: number, body: Record<string, unknown> | string) {
    super()
    this.statusCode = statusCode
    this.body = body || {}
  }
}

export const responseHandler = (statusCode: number, body?: unknown, error?: unknown) => {
  const listStatus: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    500: 'Internal Server Error',
    503: 'Service Unavailable'
  }
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }

  if (error instanceof GenerateError) {
    const errorResponse: Record<string, unknown> = {
      statusCode: error.statusCode,
      message: listStatus[error.statusCode] || listStatus[500],
      body: error.body || listStatus[500],
      headers: corsHeaders
    }
    logger.error('responseHandler: GenerateError', { errorResponse })
    throw new Error(JSON.stringify(errorResponse))
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('responseHandler: error', { error: errorMessage })
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: errorMessage
      }),
      headers: corsHeaders
    }
  }

  logger.info('responseHandler: success', { statusCode })
  return {
    statusCode,
    body: JSON.stringify(body || {}),
    headers: corsHeaders
  }
}

export {
  logger,
  tracer
}

