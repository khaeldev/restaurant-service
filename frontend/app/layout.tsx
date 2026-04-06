import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { LayoutClient } from '@/components/LayoutClient'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Restaurant Service Dashboard',
  description: 'Manager dashboard for automated dish preparation and inventory management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-100">
          <LayoutClient>{children}</LayoutClient>
        </div>
      </body>
    </html>
  )
}
