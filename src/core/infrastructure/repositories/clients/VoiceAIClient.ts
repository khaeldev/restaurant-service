import { IVoiceAIClient, TranscriptionResult, LLMResponse, VoiceContext } from '@core/domain/services/repositories/IVoiceAIClient'
import { OpenAIWhisperClient } from './OpenAIWhisperClient'
import { ClaudeAIClient } from './ClaudeAIClient'
import { CircuitBreaker } from '@core/infrastructure/resilience'
import { Bulkhead } from '@core/infrastructure/resilience'

export class VoiceAIClient implements IVoiceAIClient {
  private readonly whisperClient: OpenAIWhisperClient
  private readonly claudeClient: ClaudeAIClient

  constructor(
    whisperCircuitBreaker: CircuitBreaker,
    whisperBulkhead: Bulkhead,
    claudeCircuitBreaker: CircuitBreaker,
    claudeBulkhead: Bulkhead
  ) {
    this.whisperClient = new OpenAIWhisperClient(whisperCircuitBreaker, whisperBulkhead)
    this.claudeClient = new ClaudeAIClient(claudeCircuitBreaker, claudeBulkhead)
  }

  async transcribeAudio(audioBuffer: Buffer, format: string): Promise<TranscriptionResult> {
    return this.whisperClient.transcribeAudio(audioBuffer, format)
  }

  async processCommand(userMessage: string, context: VoiceContext): Promise<LLMResponse> {
    return this.claudeClient.processCommand(userMessage, context)
  }
}
