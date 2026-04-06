'use client'

import { useState, useEffect } from 'react'
import { useVoiceRecognition } from '@/lib/hooks/useVoiceRecognition'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { VoiceMessage } from '@/lib/types'

export function VoiceAssistant() {
  const [sessionId, setSessionId] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(false)

  // Generate session ID on mount
  useEffect(() => {
    if (!sessionId) {
      setSessionId(`session-${Date.now()}-${Math.random().toString(36).substring(7)}`)
    }
  }, [sessionId])

  const { state, messages, error, startListening, stopListening, stopSpeaking, reset } = useVoiceRecognition({
    sessionId,
    autoSpeak: true,
    onMessage: (message: VoiceMessage) => {
      console.log('New message:', message)
    },
    onError: (error: Error) => {
      console.error('Voice error:', error)
    }
  })

  const handleToggle = () => {
    if (state === 'listening') {
      stopListening()
    } else if (state === 'speaking') {
      stopSpeaking()
    } else if (state === 'idle' || state === 'error') {
      startListening()
    }
  }

  const getStateIcon = () => {
    switch (state) {
      case 'idle':
        return '🎤'
      case 'listening':
        return '🔴'
      case 'processing':
        return '⏳'
      case 'speaking':
        return '🔊'
      case 'error':
        return '❌'
      default:
        return '🎤'
    }
  }

  const getStateText = () => {
    switch (state) {
      case 'idle':
        return 'Listo para escuchar'
      case 'listening':
        return 'Escuchando...'
      case 'processing':
        return 'Procesando...'
      case 'speaking':
        return 'Hablando...'
      case 'error':
        return 'Error'
      default:
        return 'Asistente de voz'
    }
  }

  return (
    <>
      {/* Floating Widget */}
      {!isExpanded && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsExpanded(true)}
            className="rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
          >
            <span className="text-2xl">{getStateIcon()}</span>
          </Button>
        </div>
      )}

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[90vh] flex flex-col">
          <Card className="shadow-2xl flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getStateIcon()}</span>
                <h3 className="font-semibold text-gray-900">Asistente de Voz</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                ✕
              </Button>
            </div>

            {/* Status */}
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-600 text-center">
                {getStateText()}
              </p>
              {error && (
                <p className="text-xs text-red-600 text-center mt-1">
                  {error.message}
                </p>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  Presiona el botón para hablar
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.messageId}
                    className={`p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-100 text-blue-900 ml-8'
                        : 'bg-gray-100 text-gray-900 mr-8'
                    }`}
                  >
                    <p className="text-xs font-semibold mb-1">
                      {msg.role === 'user' ? 'Tú' : 'Asistente'}
                    </p>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Controls */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-2">
              <Button
                variant={state === 'listening' ? 'secondary' : 'primary'}
                size="lg"
                onClick={handleToggle}
                disabled={state === 'processing'}
                className="flex-1"
              >
                {state === 'listening' ? 'Detener' : 'Hablar'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={reset}
                disabled={state === 'listening' || state === 'processing'}
              >
                Limpiar
              </Button>
            </div>

            {/* Instructions */}
            <div className="px-6 py-4 bg-blue-50 border-t border-gray-200 text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-700">Ejemplos de comandos:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>&quot;Crear una orden de 5 platos&quot;</li>
                <li>&quot;¿Qué puedo ordenar?&quot;</li>
                <li>&quot;¿Cuál es el estado?&quot;</li>
                <li>&quot;Mostrar inventario&quot;</li>
              </ul>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
