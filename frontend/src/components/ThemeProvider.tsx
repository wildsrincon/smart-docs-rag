'use client'

import { useEffect } from 'react'
import { useSettingsStore } from '@/store/settings'
import { useLanguageStore } from '@/store/language'

function applyTheme(theme: 'light' | 'dark' | 'system') {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}

function applyFontSize(size: 'small' | 'medium' | 'large') {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.fontSize = size
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((s) => s.preferences.theme)
  const font_size = useSettingsStore((s) => s.preferences.font_size)
  const language = useLanguageStore((s) => s.language)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    applyFontSize(font_size)
  }, [font_size])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language
    }
  }, [language])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return <>{children}</>
}
