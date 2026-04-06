import { createHmac } from 'crypto'
import { IJWTService, JWTPayload } from '../../../domain/services/JWTService'
import { logger } from '@powertools/utilities'

const SECRET_KEY = process.env.JWT_SECRET || 'default-secret-key-change-in-production'

interface JWTHeader {
  alg: string
  typ: string
}

export class JWTServiceImpl implements IJWTService {
  generateToken(userId: string, email: string, expiresInHours: number = 24): string {
    const now = Math.floor(Date.now() / 1000)
    const expiresIn = now + expiresInHours * 60 * 60

    const header: JWTHeader = {
      alg: 'HS256',
      typ: 'JWT'
    }

    const payload: JWTPayload = {
      userId,
      email,
      iat: now,
      exp: expiresIn
    }

    // Create token parts
    const headerEncoded = this.base64UrlEncode(JSON.stringify(header))
    const payloadEncoded = this.base64UrlEncode(JSON.stringify(payload))

    // Create signature
    const signature = this.createSignature(`${headerEncoded}.${payloadEncoded}`)

    logger.info('JWT token generated', { userId, email, expiresIn })

    return `${headerEncoded}.${payloadEncoded}.${signature}`
  }

  verifyToken(token: string): JWTPayload | null {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        logger.warn('Invalid JWT format: wrong number of parts')
        return null
      }

      const [headerEncoded, payloadEncoded, signatureProvided] = parts

      // Verify signature
      const expectedSignature = this.createSignature(`${headerEncoded}.${payloadEncoded}`)
      if (signatureProvided !== expectedSignature) {
        logger.warn('Invalid JWT signature')
        return null
      }

      // Decode payload
      const payloadStr = this.base64UrlDecode(payloadEncoded!)
      const payload: JWTPayload = JSON.parse(payloadStr)

      // Check expiration
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp < now) {
        logger.warn('JWT token expired', { exp: payload.exp, now })
        return null
      }

      logger.info('JWT token verified', { userId: payload.userId })
      return payload
    } catch (error) {
      logger.error('JWT verification failed', { error })
      return null
    }
  }

  private createSignature(message: string): string {
    return this.base64UrlEncode(
      createHmac('sha256', SECRET_KEY)
        .update(message)
        .digest()
        .toString('binary')
    )
  }

  private base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  private base64UrlDecode(str: string): string {
    const padded = str + '==='.slice((str.length + 3) % 4)
    return Buffer.from(
      padded.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    ).toString()
  }
}
