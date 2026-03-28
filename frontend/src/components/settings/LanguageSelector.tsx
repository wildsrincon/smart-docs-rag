'use client'

import { useSettingsStore, type Language } from '@/store/settings'
import { cn } from '@/lib/utils'

const languages: { value: Language; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: 'EN' },
  { value: 'es', label: 'Espanol', flag: 'ES' },
]

export default function LanguageSelector() {
  const language = useSettingsStore((s) => s.preferences.language)
  const setLanguage = useSettingsStore((s) => s.setLanguage)

  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
        Language
      </label>
      <div className="grid grid-cols-2 gap-2">
        {languages.map(({ value, label, flag }) => (
          <button
            key={value}
            onClick={() => setLanguage(value)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200',
              language === value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
              {flag}
            </div>
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
