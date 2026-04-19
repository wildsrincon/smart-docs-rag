'use client'

import { useState } from 'react'
import { ExternalLink, Loader2, Check, X, Link2 } from 'lucide-react'
import { useSettingsStore } from '@/store/settings'
import { cn } from '@/lib/utils'

interface SocialField {
  key: keyof SocialProfile
  label: string
  placeholder: string
  iconBg: string
  iconColor: string
}

interface SocialProfile {
  linkedin: string
  twitter: string
  github: string
  instagram: string
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.88 0 1.441 1.441 0 012.88 0z" />
    </svg>
  )
}

const socialFields: (SocialField & { icon: React.ReactNode })[] = [
  {
    key: 'linkedin',
    label: 'LinkedIn',
    placeholder: 'https://linkedin.com/in/your-profile',
    iconBg: 'bg-[#0A66C2]/10 dark:bg-[#0A66C2]/20',
    iconColor: 'text-[#0A66C2]',
    icon: <LinkedInIcon className="h-5 w-5" />,
  },
  {
    key: 'twitter',
    label: 'X (Twitter)',
    placeholder: 'https://x.com/your-handle',
    iconBg: 'bg-slate-100 dark:bg-slate-700',
    iconColor: 'text-slate-900 dark:text-white',
    icon: <TwitterIcon className="h-5 w-5" />,
  },
  {
    key: 'github',
    label: 'GitHub',
    placeholder: 'https://github.com/your-username',
    iconBg: 'bg-slate-100 dark:bg-slate-700',
    iconColor: 'text-slate-900 dark:text-white',
    icon: <GitHubIcon className="h-5 w-5" />,
  },
  {
    key: 'instagram',
    label: 'Instagram',
    placeholder: 'https://instagram.com/your-handle',
    iconBg: 'bg-[#E4405F]/10 dark:bg-[#E4405F]/20',
    iconColor: 'text-[#E4405F]',
    icon: <InstagramIcon className="h-5 w-5" />,
  },
]

function isValidUrl(url: string): boolean {
  if (!url) return true
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export default function SocialProfiles() {
  const { social_profiles, message, setSocialProfile, showMessage, clearMessage } = useSettingsStore()
  const [isEditing, setIsEditing] = useState(false)
  const [localProfiles, setLocalProfiles] = useState(social_profiles)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleStartEdit() {
    setLocalProfiles(social_profiles)
    setErrors({})
    setIsEditing(true)
  }

  function handleChange(key: keyof SocialProfile, value: string) {
    setLocalProfiles((prev) => ({ ...prev, [key]: value }))
    if (value && !isValidUrl(value)) {
      setErrors((prev) => ({ ...prev, [key]: 'Enter a valid URL (https://...)' }))
    } else {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  function handleSave() {
    const newErrors: Record<string, string> = {}
    for (const [key, value] of Object.entries(localProfiles)) {
      if (value && !isValidUrl(value)) {
        newErrors[key] = 'Enter a valid URL (https://...)'
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSocialProfile(localProfiles)
    setIsEditing(false)
    showMessage('success', 'Social profiles updated successfully')
    clearMessage()
  }

  function handleCancel() {
    setLocalProfiles(social_profiles)
    setErrors({})
    setIsEditing(false)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Link2 className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          </div>
          Social Profiles
        </h3>
        {!isEditing ? (
          <button
            onClick={handleStartEdit}
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
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
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

      <div className="space-y-4">
        {socialFields.map(({ key, label, placeholder, icon, iconBg, iconColor }) => {
          const value = isEditing ? localProfiles[key] : social_profiles[key]
          return (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                {label}
              </label>
              <div className="relative">
                <div className={cn(
                  'absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center',
                  'h-8 w-8 rounded-lg',
                  iconBg,
                  iconColor,
                )}>
                  {icon}
                </div>
                {isEditing ? (
                  <input
                    type="url"
                    value={value}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={placeholder}
                    className={cn(
                      'w-full pl-14 pr-10 py-2.5 rounded-lg text-sm border bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                      'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                      errors[key]
                        ? 'border-red-300 dark:border-red-700'
                        : 'border-slate-200 dark:border-slate-700'
                    )}
                  />
                ) : (
                  <div className="w-full pl-14 pr-10 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                    {value ? (
                      <span className="truncate block">{value}</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic">Not set</span>
                    )}
                  </div>
                )}
                {value && !isEditing && (
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                    title={`Open ${label} profile`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              {errors[key] && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors[key]}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
