'use client'

import { useAuthStore } from '@/store/auth'
import { User, Mail, Shield, Bell } from 'lucide-react'

export default function SettingsPage() {
  const user = useAuthStore(s => s.user)

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Settings
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your account and preferences
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary-600" />
              Profile
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-xl font-bold text-white">
                  {user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() : '?'}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    First Name
                  </label>
                  <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                    {user?.first_name}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Last Name
                  </label>
                  <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                    {user?.last_name}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Email
                  </label>
                  <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                    {user?.email}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Provider
                  </label>
                  <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-slate-400" />
                    {user?.provider || 'manual'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary-600" />
              Notifications
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Notification preferences are coming soon.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
              Danger Zone
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Account deletion and other destructive actions will be available here.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
