'use client'

import { Type, Sparkles, Bell } from 'lucide-react'
import { useSettingsStore, type FontSize } from '@/store/settings'
import { cn } from '@/lib/utils'

const fontSizes: { value: FontSize; label: string; size: string }[] = [
  { value: 'small', label: 'Small', size: 'text-xs' },
  { value: 'medium', label: 'Medium', size: 'text-sm' },
  { value: 'large', label: 'Large', size: 'text-base' },
]

function Toggle({
  checked,
  onChange,
  label,
  description,
  icon: Icon,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description: string
  icon: typeof Sparkles
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/50">
          <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800',
          checked ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-600'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  )
}

export default function PreferencesForm() {
  const { preferences, setFontSize, setAnimations, setNotifications } = useSettingsStore()

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
        <div className="h-8 w-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        </div>
        Preferences
      </h3>

      <div className="space-y-1">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
            <Type className="h-4 w-4" />
            Font Size
          </label>
          <div className="flex gap-2">
            {fontSizes.map(({ value, label, size }) => (
              <button
                key={value}
                onClick={() => setFontSize(value)}
                className={cn(
                  'flex-1 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all duration-200',
                  preferences.font_size === value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                )}
              >
                <span className={size}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
          <Toggle
            checked={preferences.animations}
            onChange={setAnimations}
            label="Animations"
            description="Enable UI animations and transitions"
            icon={Sparkles}
          />
          <Toggle
            checked={preferences.notifications}
            onChange={setNotifications}
            label="Notifications"
            description="Receive in-app notifications"
            icon={Bell}
          />
        </div>
      </div>
    </div>
  )
}
