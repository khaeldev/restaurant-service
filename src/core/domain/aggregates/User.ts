import { ulid } from 'ulid'

export interface User {
  userId: string
  email: string
  passwordHash: string
  createdAt: string
  lastLoginAt?: string
}

export interface LoginAttempt {
  attemptId: string
  email: string
  success: boolean
  timestamp: string
  ipAddress?: string
}

export class UserDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserDomainError'
  }
}

export function createUser(email: string, passwordHash: string): User {
  return {
    userId: ulid(),
    email,
    passwordHash,
    createdAt: new Date().toISOString()
  }
}

export function recordLoginAttempt(
  email: string,
  success: boolean,
  ipAddress?: string
): LoginAttempt {
  return {
    attemptId: ulid(),
    email,
    success,
    timestamp: new Date().toISOString(),
    ipAddress
  }
}
