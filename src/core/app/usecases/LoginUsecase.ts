import { createHash } from 'crypto'
import { IUserRepository } from '../../domain/services/repositories/IUserRepository'
import { IJWTService } from '../../domain/services/JWTService'
import { recordLoginAttempt } from '../../domain/aggregates/User'
import { logger } from '@powertools/utilities'

export interface LoginRequest {
  email: string
  password: string
  ipAddress?: string
}

export interface LoginResponse {
  token: string
  userId: string
  email: string
  expiresIn: number
}

const MAX_FAILED_ATTEMPTS_PER_DAY = 5

export class LoginUsecase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: IJWTService
  ) {}

  async execute(request: LoginRequest): Promise<LoginResponse> {
    logger.info('🔐 Login attempt', { email: request.email })

    // Step 1: Check if user has exceeded daily attempt limit
    const failedAttempts = await this.userRepository.getFailedLoginAttemptsToday(request.email)
    logger.info('Failed login attempts today', { email: request.email, count: failedAttempts })

    if (failedAttempts >= MAX_FAILED_ATTEMPTS_PER_DAY) {
      logger.warn('❌ Too many failed login attempts', { email: request.email, count: failedAttempts })
      await this.userRepository.recordLoginAttempt(
        recordLoginAttempt(request.email, false, request.ipAddress)
      )
      throw new Error(`Too many login attempts. Please try again later.`)
    }

    // Step 2: Get user by email
    const user = await this.userRepository.getUserByEmail(request.email)
    if (!user) {
      logger.warn('❌ User not found', { email: request.email })
      await this.userRepository.recordLoginAttempt(
        recordLoginAttempt(request.email, false, request.ipAddress)
      )
      throw new Error('Invalid email or password')
    }

    // Step 3: Verify password
    const passwordHash = this.hashPassword(request.password)
    if (passwordHash !== user.passwordHash) {
      logger.warn('❌ Invalid password', { email: request.email })
      await this.userRepository.recordLoginAttempt(
        recordLoginAttempt(request.email, false, request.ipAddress)
      )
      throw new Error('Invalid email or password')
    }

    // Step 4: Generate JWT token
    const expiresInHours = 24
    const token = this.jwtService.generateToken(user.userId, user.email, expiresInHours)
    logger.info('✅ Login successful', { userId: user.userId, email: request.email })

    // Step 5: Record successful login attempt
    await this.userRepository.recordLoginAttempt(
      recordLoginAttempt(request.email, true, request.ipAddress)
    )

    return {
      token,
      userId: user.userId,
      email: user.email,
      expiresIn: expiresInHours * 60 * 60 // seconds
    }
  }

  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex')
  }
}
