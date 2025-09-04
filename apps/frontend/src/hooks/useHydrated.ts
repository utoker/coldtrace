import { useEffect, useState } from 'react'

/**
 * Hook to detect when hydration is complete and it's safe to render client-only content.
 * Returns false during SSR and initial hydration, true after hydration is complete.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  return hydrated
}