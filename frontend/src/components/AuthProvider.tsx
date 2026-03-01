'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import FullScreenLoader from './FullScreenLoader'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isRestoring, restoreSession } = useAuthStore()

  useEffect(() => {
    // Llama a la función de restauración una sola vez al montar
    restoreSession()
  }, [restoreSession])

  // Mientras se restaura la sesión, muestra un loader
  // Esto previene que se rendericen las páginas protegidas prematuramente
  if (isRestoring) {
    return <FullScreenLoader />
  }

  return <>{children}</>
}
