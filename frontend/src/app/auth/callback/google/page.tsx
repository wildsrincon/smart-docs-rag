'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
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
        console.log('[GoogleCallback] Starting callback with code:', code.substring(0, 10) + '...')

        localStorage.removeItem('access_token')
        document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
        useAuthStore.setState({
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
        console.log('[GoogleCallback] Cleared old auth state')

        const tokenResponse = await authApi.googleCallback(code, state)
        console.log('[GoogleCallback] Backend response received, access_token length:', tokenResponse.access_token?.length)

        if (!tokenResponse.access_token) {
          throw new Error('No access_token in response from backend')
        }

        try {
          const newPayload = JSON.parse(atob(tokenResponse.access_token.split('.')[1]))
          console.log('[GoogleCallback] New token exp:', new Date(newPayload.exp * 1000).toISOString(), 'sub:', newPayload.sub)
        } catch {
          console.warn('[GoogleCallback] Could not decode new token payload')
        }

        useAuthStore.setState({
          token: tokenResponse.access_token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })
        console.log('[GoogleCallback] Auth store updated with new token')

        localStorage.setItem('access_token', tokenResponse.access_token)

        if (typeof window !== 'undefined') {
          const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          document.cookie = `access_token=${tokenResponse.access_token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`
        }
        console.log('[GoogleCallback] Token saved to localStorage and cookie')

        await fetchUser()
        console.log('[GoogleCallback] User data fetched, login complete')

        setStatus('success')

        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 1000)
      } catch (err) {
        console.error('[GoogleCallback] OAuth callback error:', err)
        let message = 'Failed to authenticate with Google'
        if (axios.isAxiosError(err)) {
          if (err.message === 'Network Error') {
            message = 'Unable to connect to server. Please check your connection and try again.'
          } else if (err.response?.status === 429) {
            message = 'Too many login attempts. Please wait and try again.'
          } else if (err.response?.data?.detail) {
            message = err.response.data.detail
          } else if (err.response?.status === 500) {
            message = 'Server error occurred. Please try again later.'
          }
        }
        setError(message)
        setStatus('error')

        useAuthStore.setState({
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: message,
        })
        localStorage.removeItem('access_token')

        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    }

    handleGoogleCallback()
  }, [])

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
