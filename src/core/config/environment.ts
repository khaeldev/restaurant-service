const {
  REGION,
  SDK_SOCKET_TIMEOUT,
  SDK_CONNECTION_TIMEOUT,
  SERVICE_TABLE_NAME,
  SERVICE_EVENT_BUS,
  FARMERS_MARKET_API_URL,
  FARMERS_MARKET_INTERNAL_URL,
  OPENAI_API_KEY,
  ANTHROPIC_API_KEY,
  WHISPER_MODEL,
  CLAUDE_MODEL,
  JWT_SECRET
} = process.env

function resolveFarmersMarketApiUrl(): string {
  const explicit = FARMERS_MARKET_API_URL?.trim()
  if (explicit) return explicit
  const internal = FARMERS_MARKET_INTERNAL_URL?.trim()
  if (internal) return internal
  return 'https://example.com/api/farmers-market/buy'
}

export const config = {
  region: REGION,
  sdkSocketTimeout: SDK_SOCKET_TIMEOUT,
  sdkConnectionTimeout: SDK_CONNECTION_TIMEOUT,
  serviceTableName: SERVICE_TABLE_NAME || 'restaurant-service-dev',
  serviceEventBus: SERVICE_EVENT_BUS || 'restaurant-service-dev',
  farmersMarketApiUrl: resolveFarmersMarketApiUrl(),
  openaiApiKey: OPENAI_API_KEY,
  anthropicApiKey: ANTHROPIC_API_KEY,
  whisperModel: WHISPER_MODEL || 'whisper-1',
  claudeModel: CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
  jwtSecret: JWT_SECRET || 'default-secret-key-change-in-production'
}