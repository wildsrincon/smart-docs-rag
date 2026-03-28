'use client'

import { useState } from 'react'
import { User, Settings, Globe, Shield, Lock, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import ProfileForm from '@/components/settings/ProfileForm'
import PreferencesForm from '@/components/settings/PreferencesForm'
import SessionManager from '@/components/settings/SessionManager'
import PrivacySettings from '@/components/settings/PrivacySettings'
import SocialProfiles from '@/components/settings/SocialProfiles'
import PasswordChange from '@/components/settings/PasswordChange'

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: Lock },
  { id: 'appearance', label: 'Preferences', icon: Settings },
  { id: 'sessions', label: 'Sessions', icon: Globe },
  { id: 'privacy', label: 'Privacy', icon: Shield },
] as const

type TabId = (typeof tabs)[number]['id']

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile')

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Settings
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your account and preferences
          </p>
        </div>

        <div className="flex gap-6">
          <nav className="hidden md:flex flex-col gap-1 w-48 shrink-0">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left',
                  activeTab === id
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          <div className="md:hidden mb-6">
            <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                    activeTab === id
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-6">
            {activeTab === 'profile' && (
              <div className="animate-fade-in space-y-6">
                <ProfileForm />
                <SocialProfiles />
              </div>
            )}

            {activeTab === 'account' && (
              <div className="animate-fade-in space-y-6">
                <PasswordChange />
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="animate-fade-in space-y-6">
                <PreferencesForm />
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <Settings className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    Theme
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Use the sun/moon toggle in the header to switch between light and dark mode.
                    Your preference is saved automatically.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Dark mode toggle available in the header bar
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    Language
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    The chat automatically detects the language from your messages and responds accordingly.
                    Supported languages: English and Spanish.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Auto-detected from your messages
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="animate-fade-in">
                <SessionManager />
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="animate-fade-in">
                <PrivacySettings />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
