import axios from 'axios'
import { config } from '@config/environment'
import { TranscriptionResult } from '../../../domain/services/repositories/IVoiceAIClient'
import { logger } from '@powertools/utilities'

export class OpenAIWhisperClient {
  private readonly apiKey: string
  private readonly model: string
  private readonly baseUrl = 'https://api.openai.com/v1'

  constructor() {
    this.apiKey = config.openaiApiKey || ''
    this.model = config.whisperModel || 'whisper-1'

    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }
  }

  async transcribeAudio(audioBuffer: Buffer, format: string): Promise<TranscriptionResult> {
    try {
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
    } catch (error) {
      logger.error('Whisper transcription failed', { error })
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
