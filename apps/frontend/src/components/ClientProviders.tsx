'use client'

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'
import { HydrationBoundary } from './HydrationBoundary'
import { Toaster } from 'sonner'
import { WebSocketProvider } from '@/contexts/WebSocketContext'

interface ClientProvidersProps {
  children: ReactNode
}

// Dynamically import Apollo Provider to avoid SSR issues
const DynamicApolloProvider = dynamic(
  () => import('@/components/ApolloProvider').then(mod => ({ default: mod.ApolloProviderWrapper })),
  {
    ssr: false,
  }
)

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <HydrationBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 w-8 mx-auto mb-3 bg-blue-400 rounded-full"></div>
              <div className="h-3 w-24 mx-auto mb-2 bg-gray-400 rounded"></div>
              <div className="h-2 w-16 mx-auto bg-gray-300 rounded"></div>
            </div>
            <p className="text-gray-800 mt-4 font-medium">Loading ColdTrace...</p>
          </div>
        </div>
      }
    >
      <DynamicApolloProvider>
        <WebSocketProvider>
          {children}
          <Toaster 
            position="top-right"
            expand={true}
            richColors={true}
            closeButton={true}
            toastOptions={{
              style: {
                background: 'white',
                border: '1px solid #e5e7eb',
                padding: '16px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                zIndex: 9999
              }
            }}
          />
        </WebSocketProvider>
      </DynamicApolloProvider>
    </HydrationBoundary>
  )
}