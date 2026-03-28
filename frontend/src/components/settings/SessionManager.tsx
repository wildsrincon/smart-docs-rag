'use client'

import { useState } from 'react'
import { Monitor, Smartphone, Globe, LogOut, ShieldCheck, Loader2, Check, X } from 'lucide-react'
import { useSettingsStore, type SessionInfo } from '@/store/settings'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

function getDeviceIcon(device: string) {
  const lower = device.toLowerCase()
  if (lower.includes('iphone') || lower.includes('android')) return Smartphone
  return Monitor
}

function SessionCard({ session, onRevoke }: { session: SessionInfo; onRevoke: (id: string) => void }) {
  const [isRevoking, setIsRevoking] = useState(false)
  const Icon = getDeviceIcon(session.device)

  function handleRevoke() {
    setIsRevoking(true)
    setTimeout(() => {
      onRevoke(session.id)
      setIsRevoking(false)
    }, 500)
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-xl border transition-colors',
        session.is_current
          ? 'border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10'
          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          session.is_current
            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
            : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{session.device}</p>
            {session.is_current && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">
                Current
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {session.browser} &middot; {session.location}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {session.ip} &middot; {formatDistanceToNow(new Date(session.last_active), { addSuffix: true })}
          </p>
        </div>
      </div>
      {!session.is_current && (
        <button
          onClick={handleRevoke}
          disabled={isRevoking}
          className={cn(
            'flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors',
            'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isRevoking ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LogOut className="h-3.5 w-3.5" />
          )}
          Revoke
        </button>
      )}
    </div>
  )
}

export default function SessionManager() {
  const { sessions, remember_device, message, setRememberDevice, logoutOtherSessions, logoutAllSessions } = useSettingsStore()
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false)

  function handleLogoutAll() {
    setIsLoggingOutAll(true)
    setTimeout(() => {
      logoutAllSessions()
      setIsLoggingOutAll(false)
    }, 800)
  }

  const otherSessions = sessions.filter((s) => !s.is_current)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
        <div className="h-8 w-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <Globe className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        </div>
        Sessions
      </h3>

      {message && (
        <div
          className={cn(
            'mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2',
            message.type === 'success' && 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
            message.type === 'error' && 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
          )}
        >
          {message.type === 'success' ? <Check className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700">
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            Remember this device
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Stay signed in on this device</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={remember_device}
          onClick={() => setRememberDevice(!remember_device)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800',
            remember_device ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-600'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out',
              remember_device ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-slate-900 dark:text-white">Active Sessions</p>
          <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
            {sessions.length}
          </span>
        </div>
        <div className="space-y-2">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} onRevoke={(id) => logoutOtherSessions([id])} />
          ))}
        </div>
      </div>

      {otherSessions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={handleLogoutAll}
            disabled={isLoggingOutAll}
            className={cn(
              'w-full flex items-center justify-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors',
              'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20',
              'border border-red-200 dark:border-red-800',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isLoggingOutAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Logout all other sessions
          </button>
        </div>
      )}
    </div>
  )
}
