import assert from 'node:assert'
import { Before, Then, When } from '@cucumber/cucumber'
import type { ApiWorld } from '../support/world'
import { formatLastHttpDebug } from '../support/debug'

Before({ tags: '@smoke' }, async function (this: ApiWorld) {
  if (process.env.BDD_VERBOSE) {
    await this.log(`[BDD] smoke baseUrl=${this.baseUrl}\n`)
  }
})

Before({ tags: '@integration' }, async function (this: ApiWorld) {
  if (process.env.BDD_VERBOSE) {
    await this.log(`[BDD] integration baseUrl=${this.baseUrl}\n`)
  }
})

When('I request farmers market stock for ingredient {string}', async function (this: ApiWorld, ingredient: string) {
  const url = `${this.baseUrl}/farmers-market/buy?ingredient=${encodeURIComponent(ingredient)}`
  this.lastRequestUrl = url
  const res = await fetch(url)
  console.log(res)
  this.lastStatus = res.status
  this.lastJson = await res.json() as unknown
  if (process.env.BDD_VERBOSE) {
    console.error('[BDD]', { url, status: this.lastStatus, body: this.lastJson })
  }
})

When(
  'I log in with email {string} and password {string}',
  async function (this: ApiWorld, email: string, password: string) {
    const url = `${this.baseUrl}/auth/login`
    this.lastRequestUrl = url
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    this.lastStatus = res.status
    try {
      this.lastJson = await res.json() as unknown
    } catch {
      this.lastJson = null
    }
    if (process.env.BDD_VERBOSE) {
      console.error('[BDD]', { url, status: this.lastStatus, body: this.lastJson })
    }
  }
)

Then('the response status should be {int}', function (this: ApiWorld, expected: number) {
  assert.strictEqual(
    this.lastStatus,
    expected,
    `Expected status ${expected}, got ${this.lastStatus}.\n${formatLastHttpDebug(this)}`
  )
})

Then('the response should include a numeric quantitySold field', function (this: ApiWorld) {
  assert.ok(this.lastJson !== null && typeof this.lastJson === 'object', 'Response body should be an object')
  const body = this.lastJson as Record<string, unknown>
  assert.ok('quantitySold' in body, 'quantitySold missing')
  assert.strictEqual(typeof body.quantitySold, 'number', 'quantitySold should be a number')
})

Then('the response should contain a JWT token', function (this: ApiWorld) {
  assert.ok(this.lastJson !== null && typeof this.lastJson === 'object', 'Response body should be an object')
  const body = this.lastJson as Record<string, unknown>
  assert.ok(
    typeof body.token === 'string' && body.token.length > 0,
    `token should be a non-empty string.\n${formatLastHttpDebug(this)}`
  )
})
