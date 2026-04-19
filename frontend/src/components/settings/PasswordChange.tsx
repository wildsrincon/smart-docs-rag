'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff, Loader2, Check, X, ShieldCheck } from 'lucide-react'
import { useSettingsStore } from '@/store/settings'
import { cn } from '@/lib/utils'

export default function PasswordChange() {
  const { message, showMessage, clearMessage } = useSettingsStore()
  const [currentPassword] = useState('••••••••')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isChanging, setIsChanging] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSuccess, setIsSuccess] = useState(false)

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    if (!newPassword) {
      newErrors.newPassword = 'New password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleChangePassword() {
    if (!validate()) return

    setIsChanging(true)
    setIsSuccess(false)

    await new Promise((r) => setTimeout(r, 1200))

    setNewPassword('')
    setConfirmPassword('')
    setIsChanging(false)
    setIsSuccess(true)
    showMessage('success', 'Password changed successfully')

    setTimeout(() => {
      setIsSuccess(false)
    }, 3000)

    clearMessage()
  }

  const passwordStrength = newPassword.length === 0
    ? null
    : newPassword.length < 8
      ? 'weak'
      : newPassword.length < 12
        ? 'medium'
        : 'strong'

  const strengthConfig = {
    weak: { label: 'Weak', color: 'bg-red-500', width: 'w-1/3' },
    medium: { label: 'Medium', color: 'bg-amber-500', width: 'w-2/3' },
    strong: { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' },
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Lock className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          </div>
          Change Password
        </h3>
        {isSuccess && (
          <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <Check className="h-4 w-4" />
            Updated
          </div>
        )}
      </div>

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

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Current Password
          </label>
          <div className="relative">
            <input
              type="text"
              value={currentPassword}
              readOnly
              className="w-full px-3 py-2.5 rounded-lg text-sm border bg-slate-100 dark:bg-slate-900/70 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              Read-only
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Managed by your authentication provider
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                if (errors.newPassword) {
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.newPassword
                    return next
                  })
                }
              }}
              placeholder="Enter new password"
              className={cn(
                'w-full px-10 py-2.5 rounded-lg text-sm border bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                errors.newPassword
                  ? 'border-red-300 dark:border-red-700'
                  : 'border-slate-200 dark:border-slate-700'
              )}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              <Lock className="h-4 w-4" />
            </div>
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.newPassword}</p>
          )}

          {passwordStrength && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      strengthConfig[passwordStrength].color,
                      strengthConfig[passwordStrength].width,
                    )}
                  />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {strengthConfig[passwordStrength].label}
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (errors.confirmPassword) {
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.confirmPassword
                    return next
                  })
                }
              }}
              placeholder="Confirm new password"
              className={cn(
                'w-full px-10 py-2.5 rounded-lg text-sm border bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                errors.confirmPassword
                  ? 'border-red-300 dark:border-red-700'
                  : 'border-slate-200 dark:border-slate-700'
              )}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        <button
          onClick={handleChangePassword}
          disabled={isChanging || (!newPassword && !confirmPassword)}
          className={cn(
            'w-full flex items-center justify-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg transition-all duration-200',
            'bg-primary-600 hover:bg-primary-700 text-white',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {isChanging ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Changing...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Change Password
            </>
          )}
        </button>
      </div>
    </div>
  )
}
