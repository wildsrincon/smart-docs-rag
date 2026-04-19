'use client'

import { useState } from 'react'
import { Shield, BarChart3, MessageSquare, Trash2, AlertTriangle, Loader2, Check, X } from 'lucide-react'
import { useSettingsStore } from '@/store/settings'
import { cn } from '@/lib/utils'

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  variant = 'danger',
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  variant?: 'danger' | 'critical'
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full mx-4 shadow-xl animate-in">
        <div className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full mx-auto mb-4',
          variant === 'critical'
            ? 'bg-red-100 dark:bg-red-900/30'
            : 'bg-amber-100 dark:bg-amber-900/30'
        )}>
          <AlertTriangle className={cn(
            'h-6 w-6',
            variant === 'critical'
              ? 'text-red-600 dark:text-red-400'
              : 'text-amber-600 dark:text-amber-400'
          )} />
        </div>
        <h4 className="text-lg font-semibold text-slate-900 dark:text-white text-center mb-2">{title}</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'flex-1 px-4 py-2.5 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50',
              variant === 'critical'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-amber-600 hover:bg-amber-700'
            )}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function PrivacyToggle({
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
  icon: typeof Shield
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

export default function PrivacySettings() {
  const { privacy, isSaving, message, setPrivacy, clearChatHistory, clearAllData } = useSettingsStore()
  const [showChatConfirm, setShowChatConfirm] = useState(false)
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [step, setStep] = useState(0)

  function handleClearChat() {
    clearChatHistory().finally(() => setShowChatConfirm(false))
  }

  function handleDeleteAll() {
    if (step === 0) {
      setStep(1)
      return
    }
    if (step === 1) {
      if (deleteConfirmText.toLowerCase() !== 'delete') return
      clearAllData().finally(() => {
        setShowDeleteAllConfirm(false)
        setStep(0)
        setDeleteConfirmText('')
      })
    }
  }

  function handleCloseDeleteAll() {
    setShowDeleteAllConfirm(false)
    setStep(0)
    setDeleteConfirmText('')
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
        <div className="h-8 w-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <Shield className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        </div>
        Privacy
      </h3>

      {message && (
        <div
          className={cn(
            'mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2',
            message.type === 'success' && 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
            message.type === 'error' && 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
            message.type === 'warning' && 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
          )}
        >
          {message.type === 'success' ? <Check className="h-4 w-4 shrink-0" /> : message.type === 'warning' ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
          {message.text}
        </div>
      )}

      <div className="space-y-1">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
            Profile Visibility
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['public', 'private'] as const).map((value) => (
              <button
                key={value}
                onClick={() => setPrivacy({ profile_visibility: value })}
                className={cn(
                  'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all duration-200',
                  privacy.profile_visibility === value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                )}
              >
                {value === 'public' ? <Shield className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
          <PrivacyToggle
            checked={privacy.share_statistics}
            onChange={(v) => setPrivacy({ share_statistics: v })}
            label="Share Statistics"
            description="Help improve the app by sharing anonymous usage stats"
            icon={BarChart3}
          />
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/50">
                <MessageSquare className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Clear Chat History</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Delete all your chat messages</p>
              </div>
            </div>
            <button
              onClick={() => setShowChatConfirm(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Delete All Data</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Permanently delete your account and all data</p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteAllConfirm(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showChatConfirm}
        title="Clear Chat History"
        description="This will permanently delete all your chat messages and conversations. This action cannot be undone."
        confirmLabel="Clear History"
        loading={isSaving}
        onConfirm={handleClearChat}
        onCancel={() => setShowChatConfirm(false)}
      />

      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseDeleteAll} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full mx-4 shadow-xl animate-in">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>

            {step === 0 ? (
              <>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white text-center mb-2">
                  Delete All Data
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
                  This will permanently delete your account, all documents, chats, and settings. This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleCloseDeleteAll}
                    className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAll}
                    className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <h4 className="text-lg font-semibold text-red-600 dark:text-red-400 text-center mb-2">
                  Final Confirmation
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">
                  Type <strong className="text-slate-900 dark:text-white">&quot;delete&quot;</strong> to confirm permanent deletion of all your data.
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type 'delete' to confirm"
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleCloseDeleteAll}
                    disabled={isSaving}
                    className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAll}
                    disabled={isSaving || deleteConfirmText.toLowerCase() !== 'delete'}
                    className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Delete Everything'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
