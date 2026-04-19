'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import FullScreenLoader from './FullScreenLoader'

const SKIP_RESTORE_PATHS = ['/auth/callback', '/login', '/register']

function shouldSkipRestore(): boolean {
  if (typeof window === 'undefined') return false
  return SKIP_RESTORE_PATHS.some((p) => window.location.pathname.startsWith(p))
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isRestoring, restoreSession } = useAuthStore()

  useEffect(() => {
    if (shouldSkipRestore()) {
      console.log('[AuthProvider] Skipping restoreSession on auth callback page')
      useAuthStore.setState({ isRestoring: false })
      return
    }
    restoreSession()
  }, [restoreSession])

  if (isRestoring) {
    return <FullScreenLoader />
  }

  return <>{children}</>
}
