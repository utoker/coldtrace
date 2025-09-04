'use client'

import { ApolloProvider } from '@apollo/client/react'
import { ReactNode, useMemo } from 'react'
import { createApolloClient } from '@/lib/apollo-client'
import { ErrorBoundary } from './ErrorBoundary'

interface ApolloProviderWrapperProps {
  children: ReactNode
}

export function ApolloProviderWrapper({ children }: ApolloProviderWrapperProps) {
  // Create Apollo Client - this component is only rendered after hydration
  const client = useMemo(() => {
    try {
      return createApolloClient()
    } catch (error) {
      console.error('Failed to create Apollo Client:', error)
      return null
    }
  }, [])

  // Show connection error if client creation failed
  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">
            Failed to Connect
          </h1>
          <p className="text-gray-800 mb-4">
            Unable to initialize ColdTrace. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <ApolloProvider client={client}>
        {children}
      </ApolloProvider>
    </ErrorBoundary>
  )
}