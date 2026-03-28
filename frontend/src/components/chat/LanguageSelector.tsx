'use client'

import { useState, useRef, useEffect } from 'react'
import { Globe, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: 'EN' },
  { code: 'es', name: 'Español', flag: 'ES' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

function detectBrowserLanguage(): LanguageCode {
  if (typeof navigator === 'undefined') return 'en'
  const lang = navigator.language || 'en'
  const code = lang.split('-')[0] as string
  return LANGUAGES.some((l) => l.code === code) ? (code as LanguageCode) : 'en'
}

function getStoredLanguage(): LanguageCode {
  if (typeof localStorage === 'undefined') return 'en'
  const stored = localStorage.getItem('chat_language')
  return (LANGUAGES.some((l) => l.code === stored) ? stored : 'en') as LanguageCode
}

export function getInitialLanguage(): LanguageCode {
  return getStoredLanguage() || detectBrowserLanguage()
}

interface LanguageSelectorProps {
  onChangeLang?: (code: LanguageCode) => void
}

export default function LanguageSelector({ onChangeLang }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState<LanguageCode>(getInitialLanguage)
  const [justChanged, setJustChanged] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChange = (code: LanguageCode) => {
    if (code === currentLang) {
      setIsOpen(false)
      return
    }
    setCurrentLang(code)
    localStorage.setItem('chat_language', code)
    onChangeLang?.(code)
    setIsOpen(false)
    setJustChanged(true)
    setTimeout(() => setJustChanged(false), 1000)
  }

  const current = LANGUAGES.find((l) => l.code === currentLang)!

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
          justChanged
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
        )}
        title={`Language: ${current.name}`}
      >
        <Globe className={cn('w-4 h-4', justChanged && 'text-emerald-600 dark:text-emerald-400')} />
        <span className="hidden sm:inline">{current.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 py-1 w-40 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg z-50">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleChange(lang.code)}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors',
                lang.code === currentLang
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              )}
            >
              <span className="w-5 text-xs font-bold opacity-60">{lang.flag}</span>
              <span className="flex-1 text-left">{lang.name}</span>
              {lang.code === currentLang && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
