import axios from 'axios'
import { config } from '@config/environment'
import { TranscriptionResult } from '@core/domain/services/repositories/IVoiceAIClient'
import { logger } from '@powertools/utilities'
import { CircuitBreaker } from '@core/infrastructure/resilience'
import { Bulkhead } from '@core/infrastructure/resilience'

export class OpenAIWhisperClient {
  private readonly apiKey: string
  private readonly model: string
  private readonly baseUrl = 'https://api.openai.com/v1'

  constructor(
    private readonly circuitBreaker: CircuitBreaker,
    private readonly bulkhead: Bulkhead
  ) {
    this.apiKey = config.openaiApiKey || ''
    this.model = config.whisperModel || 'whisper-1'

    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }
  }

  async transcribeAudio(audioBuffer: Buffer, format: string): Promise<TranscriptionResult> {
    return this.bulkhead.execute(() =>
      this.circuitBreaker.execute(async () => {
        const formData = new FormData()
        const blob = new Blob([audioBuffer], { type: `audio/${format}` })

        formData.append('file', blob, `audio.${format}`)
        formData.append('model', this.model)
        formData.append('language', 'es')
        formData.append('response_format', 'verbose_json')

        const response = await axios.post(
          `${this.baseUrl}/audio/transcriptions`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`
            },
            timeout: 30000
          }
        )

        logger.info('Whisper transcription successful', {
          text: response.data.text,
          language: response.data.language
        })

        return {
          text: response.data.text,
          language: response.data.language,
          confidence: response.data.segments?.[0]?.confidence
        }
      })
    )
  }
}
