'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/lib/api'

export default function GoogleCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const fetchUser = useAuthStore((state) => state.fetchUser)
  const isProcessing = useRef(false)

  useEffect(() => {
    const handleGoogleCallback = async () => {
      // Prevent multiple executions (Next.js dev mode renders twice)
      if (isProcessing.current) {
        return
      }
      isProcessing.current = true

      const code = searchParams.get('code')
      const state = searchParams.get('state')

      if (!code || !state) {
        setError('Missing authorization code or state')
        setStatus('error')
        return
      }

      try {
        // Exchange code for token
        const tokenResponse = await authApi.googleCallback(code, state)

        // Update auth store with authenticated state FIRST
        useAuthStore.setState({
          token: tokenResponse.access_token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })

        // Store token in localStorage for persistence
        localStorage.setItem('access_token', tokenResponse.access_token)

        // Set cookie for server-side auth
        if (typeof window !== 'undefined') {
          const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          document.cookie = `access_token=${tokenResponse.access_token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`
        }

        // Fetch user data
        await fetchUser()

        setStatus('success')

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 1000)
      } catch (err) {
        console.error('Google OAuth callback error:', err)
        setError(err instanceof Error ? err.message : 'Failed to authenticate with Google')
        setStatus('error')

        // Clear any partial auth state
        useAuthStore.setState({
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to authenticate',
        })
        localStorage.removeItem('access_token')

        // Redirect to login page after a delay
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
      // Don't reset isProcessing.current - prevent any re-execution
    }

    handleGoogleCallback()
  }, []) // Empty dependency array - run only once

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Signing you in with Google...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Authentication Successful!
                </h2>
                <p className="text-gray-600">Redirecting you to dashboard...</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Authentication Failed
                </h2>
                <p className="text-gray-600 text-sm mb-2">{error}</p>
                <p className="text-gray-500 text-sm">
                  Redirecting to login page...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
