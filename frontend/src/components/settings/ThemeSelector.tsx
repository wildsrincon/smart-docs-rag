'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useSettingsStore, type Theme } from '@/store/settings'
import { cn } from '@/lib/utils'

const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export default function ThemeSelector() {
  const theme = useSettingsStore((s) => s.preferences.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)

  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
        Theme
      </label>
      <div className="grid grid-cols-3 gap-2">
        {themes.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              'flex flex-col items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all duration-200',
              theme === value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
