'use client'

import useSWR from 'swr'
import { getVoiceContext } from '../api'
import type { VoiceContextData } from '../types'

export function useVoiceContext() {
  const { data, error, isLoading, mutate } = useSWR<VoiceContextData>(
    '/voice/context',
    getVoiceContext,
    {
      refreshInterval: 10000, // Refresh every 10s
      revalidateOnFocus: true
    }
  )

  return {
    context: data,
    isLoading,
    error,
    mutate
  }
}
