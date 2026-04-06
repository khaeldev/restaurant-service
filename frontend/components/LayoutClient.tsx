'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { VoiceAssistant } from './voice/VoiceAssistant'

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, loading, logout } = useAuth()

  // Don't show nav on login page
  if (pathname === '/login') {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <>{children}</>
  }

  return (
    <>
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🍽️</span>
              <span className="font-bold text-gray-900">Restaurant Service Dashboard</span>
            </Link>

            <div className="hidden md:flex space-x-1">
              <NavLink href="/">Create Order</NavLink>
              <NavLink href="/orders">Orders</NavLink>
              <NavLink href="/inventory">Inventory</NavLink>
              <NavLink href="/purchases">Purchases</NavLink>
              <NavLink href="/recipes">Recipes</NavLink>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600 text-sm">
            restaurant-service — Automated Dish Preparation System
          </p>
        </div>
      </footer>

      {/* Voice Assistant Widget */}
      <VoiceAssistant />
    </>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
    >
      {children}
    </Link>
  )
}
