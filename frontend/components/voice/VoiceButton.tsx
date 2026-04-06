'use client'

import { Button } from '@/components/ui/Button'

interface VoiceButtonProps {
  onClick: () => void
  isListening: boolean
  disabled?: boolean
}

export function VoiceButton({ onClick, isListening, disabled }: VoiceButtonProps) {
  return (
    <Button
      variant={isListening ? 'secondary' : 'primary'}
      size="lg"
      onClick={onClick}
      disabled={disabled}
      className={`transition-all duration-300 ${isListening ? 'animate-pulse' : ''}`}
    >
      <span className="mr-2">{isListening ? '🔴' : '🎤'}</span>
      {isListening ? 'Escuchando...' : 'Hablar'}
    </Button>
  )
}
