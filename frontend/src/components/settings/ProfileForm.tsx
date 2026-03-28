'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2, Check, X } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import { cn } from '@/lib/utils'

export default function ProfileForm() {
  const user = useAuthStore((s) => s.user)
  const { profile, isSaving, message, updateProfile, setAvatar, showMessage, clearMessage } = useSettingsStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const firstName = profile.first_name || user?.first_name || ''
  const lastName = profile.last_name || user?.last_name || ''
  const email = user?.email || ''
  const avatarUrl = avatarPreview || profile.avatar_url || user?.avatar_url || null
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!firstName.trim()) errors.first_name = 'First name is required'
    if (!lastName.trim()) errors.last_name = 'Last name is required'
    if (profile.bio && profile.bio.length > 280) errors.bio = 'Bio must be 280 characters or less'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSave() {
    if (!validate()) return
    updateProfile({ first_name: firstName, last_name: lastName, bio: profile.bio, avatar_url: avatarUrl })
    setIsEditing(false)
    showMessage('success', 'Profile updated successfully')
    clearMessage()
  }

  function handleCancel() {
    setIsEditing(false)
    setFormErrors({})
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'Image must be less than 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setAvatarPreview(result)
      setAvatar(result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Camera className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          </div>
          Profile
        </h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
          >
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Save
            </button>
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

      <div className="flex items-start gap-6 mb-6">
        <div className="relative group">
          <div className="h-20 w-20 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-2xl font-bold text-white shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              initials || '?'
            )}
          </div>
          {isEditing && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <div className="min-w-0 pt-1">
          <p className="font-semibold text-slate-900 dark:text-white truncate">
            {firstName} {lastName}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{email}</p>
          {isEditing && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Click avatar to change photo (max 5MB)
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            First Name
          </label>
          {isEditing ? (
            <div>
              <input
                type="text"
                value={profile.first_name || user?.first_name || ''}
                onChange={(e) => updateProfile({ first_name: e.target.value })}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-sm border bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  formErrors.first_name
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-slate-200 dark:border-slate-700'
                )}
              />
              {formErrors.first_name && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">{formErrors.first_name}</p>
              )}
            </div>
          ) : (
            <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
              {user?.first_name || '-'}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Last Name
          </label>
          {isEditing ? (
            <div>
              <input
                type="text"
                value={profile.last_name || user?.last_name || ''}
                onChange={(e) => updateProfile({ last_name: e.target.value })}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-sm border bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  formErrors.last_name
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-slate-200 dark:border-slate-700'
                )}
              />
              {formErrors.last_name && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">{formErrors.last_name}</p>
              )}
            </div>
          ) : (
            <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
              {user?.last_name || '-'}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Email
          </label>
          <div className="relative">
            <div className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-900/70 text-sm text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed">
              {user?.email || '-'}
            </div>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              Read-only
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Provider
          </label>
          <div className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-900/70 text-sm text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
            {user?.provider === 'google' ? 'Google' : user?.provider || 'Email'}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Bio
          </label>
          {isEditing ? (
            <div>
              <textarea
                value={profile.bio}
                onChange={(e) => updateProfile({ bio: e.target.value })}
                placeholder="Tell us a bit about yourself..."
                rows={3}
                maxLength={280}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-sm border bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors resize-none',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                  formErrors.bio
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-slate-200 dark:border-slate-700'
                )}
              />
              <div className="flex justify-between mt-1">
                {formErrors.bio && (
                  <p className="text-xs text-red-500 dark:text-red-400">{formErrors.bio}</p>
                )}
                <p className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
                  {profile.bio.length}/280
                </p>
              </div>
            </div>
          ) : (
            <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 min-h-[60px]">
              {profile.bio || (
                <span className="text-slate-400 dark:text-slate-500 italic">No bio added yet</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
