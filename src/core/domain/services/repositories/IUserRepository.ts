import { User, LoginAttempt } from '../../aggregates/User'

export interface IUserRepository {
  getUserByEmail(email: string): Promise<User | null>
  createUser(user: User): Promise<void>
  recordLoginAttempt(attempt: LoginAttempt): Promise<void>
  getFailedLoginAttemptsToday(email: string): Promise<number>
}
