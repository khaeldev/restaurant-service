import { setWorldConstructor, World } from '@cucumber/cucumber'

/**
 * Shared state for HTTP API scenarios (base URL from API_BASE_URL, default serverless-offline dev).
 */
export class ApiWorld extends World {
  lastStatus = 0
  lastJson: unknown = null
  lastRequestUrl: string | null = null

  readonly baseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:3000/dev'

  constructor(options: any) {
    super(options)
    if (process.env.BDD_VERBOSE) {
      console.log('[BDD] ApiWorld baseUrl:', this.baseUrl)
    }
  }
}

setWorldConstructor(ApiWorld)
