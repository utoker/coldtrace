'use client'

import { ReactNode } from 'react'
import { useHydrated } from '@/hooks/useHydrated'

interface HydrationBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Component that prevents hydration mismatch by providing consistent
 * server/client rendering. Shows fallback during SSR and initial hydration,
 * then shows children after hydration is complete.
 */
export function HydrationBoundary({ children, fallback }: HydrationBoundaryProps) {
  const hydrated = useHydrated()

  if (!hydrated) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 w-8 mx-auto mb-3 bg-blue-400 rounded-full"></div>
              <div className="h-3 w-24 mx-auto mb-2 bg-gray-400 rounded"></div>
              <div className="h-2 w-16 mx-auto bg-gray-300 rounded"></div>
            </div>
            <p className="text-gray-700 mt-4 text-sm">Initializing...</p>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}