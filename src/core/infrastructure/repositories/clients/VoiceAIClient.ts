import { IVoiceAIClient, TranscriptionResult, LLMResponse, VoiceContext } from '../../../domain/services/repositories/IVoiceAIClient'
import { OpenAIWhisperClient } from './OpenAIWhisperClient'
import { ClaudeAIClient } from './ClaudeAIClient'

export class VoiceAIClient implements IVoiceAIClient {
  private readonly whisperClient: OpenAIWhisperClient
  private readonly claudeClient: ClaudeAIClient

  constructor() {
    this.whisperClient = new OpenAIWhisperClient()
    this.claudeClient = new ClaudeAIClient()
  }

  async transcribeAudio(audioBuffer: Buffer, format: string): Promise<TranscriptionResult> {
    return this.whisperClient.transcribeAudio(audioBuffer, format)
  }

  async processCommand(userMessage: string, context: VoiceContext): Promise<LLMResponse> {
    return this.claudeClient.processCommand(userMessage, context)
  }
}
