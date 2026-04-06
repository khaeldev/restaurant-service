'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { processVoiceCommand } from '../api'
import type { VoiceAssistantState, VoiceMessage } from '../types'

interface UseVoiceRecognitionOptions {
  sessionId: string
  autoSpeak?: boolean
  onMessage?: (message: VoiceMessage) => void
  onError?: (error: Error) => void
}

export function useVoiceRecognition(options: UseVoiceRecognitionOptions) {
  const [state, setState] = useState<VoiceAssistantState>('idle')
  const [messages, setMessages] = useState<VoiceMessage[]>([])
  const [error, setError] = useState<Error | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // Initialize audio context and speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      synthRef.current = window.speechSynthesis
    }

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      audioContextRef.current?.close()
    }
  }, [])

  const startListening = useCallback(async () => {
    try {
      setState('listening')
      setError(null)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(track => track.stop())

        // Process the audio
        await processAudio(audioBlob)
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start recording')
      setError(error)
      setState('error')
      options.onError?.(error)
    }
  }, [options])

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setState('processing')
    }
  }, [])

  const processAudio = useCallback(async (audioBlob: Blob) => {
    try {
      setState('processing')

      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      let binaryString = ''
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i])
      }
      const base64Audio = btoa(binaryString)

      // Send to backend
      const response = await processVoiceCommand({
        sessionId: options.sessionId,
        audio: base64Audio,
        audioFormat: 'webm'
      })

      // Add messages
      const userMessage: VoiceMessage = {
        messageId: `user-${Date.now()}`,
        role: 'user',
        content: response.userMessage,
        timestamp: new Date().toISOString()
      }

      const assistantMessage: VoiceMessage = {
        messageId: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.assistantMessage,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, userMessage, assistantMessage])
      options.onMessage?.(userMessage)
      options.onMessage?.(assistantMessage)

      // Speak response if enabled
      if (options.autoSpeak && synthRef.current) {
        setState('speaking')
        speak(response.assistantMessage)
      } else {
        setState('idle')
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to process audio')
      setError(error)
      setState('error')
      options.onError?.(error)
    }
  }, [options])

  const speak = useCallback((text: string) => {
    if (!synthRef.current) {
      setState('idle')
      return
    }

    // Cancel any ongoing speech
    synthRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-ES'
    utterance.rate = 1.0
    utterance.pitch = 1.0

    utterance.onend = () => {
      setState('idle')
    }

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event)
      setState('idle')
    }

    synthRef.current.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setState('idle')
    }
  }, [])

  const reset = useCallback(() => {
    stopSpeaking()
    setMessages([])
    setError(null)
    setState('idle')
  }, [stopSpeaking])

  return {
    state,
    messages,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    reset
  }
}
