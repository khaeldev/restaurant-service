import { z } from 'zod'

export const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export type LoginRequest = z.infer<typeof LoginRequestSchema>

export const LoginResponseSchema = z.object({
  token: z.string(),
  userId: z.string(),
  email: z.string(),
  expiresIn: z.number()
})

export type LoginResponse = z.infer<typeof LoginResponseSchema>
