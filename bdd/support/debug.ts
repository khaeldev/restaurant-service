import type { ApiWorld } from './world'

/** Appends to assertion errors so failures show what the API actually returned. */
export function formatLastHttpDebug(world: ApiWorld): string {
  const body = safeStringify(world.lastJson)
  const lines = [
    `HTTP ${world.lastStatus}`,
    world.lastRequestUrl ? `url: ${world.lastRequestUrl}` : null,
    `body: ${body}`
  ].filter(Boolean)
  return lines.join('\n')
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}
