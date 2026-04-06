export interface JWTPayload {
  userId: string
  email: string
  iat: number
  exp: number
}

export interface IJWTService {
  generateToken(userId: string, email: string, expiresInHours?: number): string
  verifyToken(token: string): JWTPayload | null
}
