import {
  APIGatewayAuthorizerResult,
  APIGatewayRequestAuthorizerEvent
} from 'aws-lambda'
import { JWTServiceImpl } from '@core/infrastructure/repositories/services/JWTServiceImpl'
import { logger } from '@powertools/utilities'

const jwtService = new JWTServiceImpl()

export const handler = async (
  event: APIGatewayRequestAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  try {
    logger.info('🔐 Authorizer: validating token', {
      requestContext: event
    })

    const authHeader =
      event.headers?.Authorization || event.headers?.authorization

    if (!authHeader) {
      logger.warn('❌ Authorizer: no token provided')
      throw new Error('Unauthorized')
    }

    const token = extractToken(authHeader)

    if (!token) {
      logger.warn('❌ Authorizer: invalid authorization header format')
      throw new Error('Unauthorized')
    }

    // Verify JWT token
    const payload = jwtService.verifyToken(token)
    if (!payload) {
      logger.warn('❌ Authorizer: invalid or expired token')
      throw new Error('Unauthorized')
    }

    logger.info('✅ Authorizer: token valid', {
      userId: payload.userId,
      email: payload.email
    })

    const arnParts = event.methodArn.split(':');
    const apiGatewayArnTmp = arnParts[5]!.split('/');
    const awsAccountId = arnParts[4];

    const region = arnParts[3];
    const restApiId = apiGatewayArnTmp[0];
    const stage = apiGatewayArnTmp[1];

    const wildcardArn = `arn:aws:execute-api:${region}:${awsAccountId}:${restApiId}/${stage}/*/*`;

    return {
      principalId: payload.userId,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: wildcardArn
          }
        ]
      },
      context: {
        userId: payload.userId,
        email: payload.email,
        iat: payload.iat.toString(),
        exp: payload.exp.toString()
      }
    }
  } catch (error) {
    logger.error('❌ Authorizer: authorization failed', {
      error: error instanceof Error ? error.message : String(error)
    })
    throw new Error('Unauthorized')
  }
}

function extractToken(authorizationHeader: string): string | null {
  if (!authorizationHeader) {
    return null
  }

  const parts = authorizationHeader.split(' ')
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer') {
    logger.warn('Invalid authorization header format')
    return null
  }

  return parts[1]!
}