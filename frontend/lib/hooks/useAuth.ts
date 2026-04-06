'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export interface AuthUser {
  userId: string
  email: string
  token: string
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const userId = localStorage.getItem('userId')
    const email = localStorage.getItem('email')

    if (token && userId && email) {
      setUser({ token, userId, email })
    } else {
      // Only redirect if not on login page
      if (pathname !== '/login') {
        router.push('/login')
      }
    }

    setLoading(false)
  }, [router, pathname])

  // Listen for storage changes (handles cross-tab changes and syncs auth state)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'userId' || e.key === 'email') {
        const token = localStorage.getItem('token')
        const userId = localStorage.getItem('userId')
        const email = localStorage.getItem('email')

        if (token && userId && email) {
          setUser({ token, userId, email })
        } else {
          setUser(null)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('email')
    setUser(null)
    router.push('/login')
  }

  return { user, loading, logout }
}
