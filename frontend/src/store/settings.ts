import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'
export type Language = 'en' | 'es'
export type FontSize = 'small' | 'medium' | 'large'

export interface UserProfile {
  first_name: string
  last_name: string
  email: string
  avatar_url: string | null
  bio: string
}

export interface SessionInfo {
  id: string
  device: string
  browser: string
  ip: string
  location: string
  last_active: string
  is_current: boolean
}

export interface UserPreferences {
  theme: Theme
  language: Language
  font_size: FontSize
  animations: boolean
  notifications: boolean
}

export interface PrivacySettings {
  profile_visibility: 'public' | 'private'
  share_statistics: boolean
}

export interface SettingsState {
  profile: UserProfile
  preferences: UserPreferences
  sessions: SessionInfo[]
  privacy: PrivacySettings
  remember_device: boolean

  isSaving: boolean
  message: { type: 'success' | 'error' | 'warning'; text: string } | null

  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
  setFontSize: (size: FontSize) => void
  setAnimations: (enabled: boolean) => void
  setNotifications: (enabled: boolean) => void
  updateProfile: (profile: Partial<UserProfile>) => void
  setAvatar: (url: string | null) => void
  setPrivacy: (settings: Partial<PrivacySettings>) => void
  setRememberDevice: (remember: boolean) => void
  logoutOtherSessions: (sessionIds: string[]) => void
  logoutAllSessions: () => void
  clearChatHistory: () => Promise<void>
  clearAllData: () => Promise<void>
  showMessage: (type: 'success' | 'error' | 'warning', text: string) => void
  clearMessage: () => void
}

const mockSessions: SessionInfo[] = [
  {
    id: '1',
    device: 'MacBook Pro',
    browser: 'Chrome 122',
    ip: '192.168.1.***',
    location: 'Buenos Aires, AR',
    last_active: new Date().toISOString(),
    is_current: true,
  },
  {
    id: '2',
    device: 'iPhone 15',
    browser: 'Safari Mobile',
    ip: '181.***.***.42',
    location: 'Buenos Aires, AR',
    last_active: new Date(Date.now() - 3600000 * 2).toISOString(),
    is_current: false,
  },
  {
    id: '3',
    device: 'Windows Desktop',
    browser: 'Firefox 123',
    ip: '10.0.0.***',
    location: 'New York, US',
    last_active: new Date(Date.now() - 86400000).toISOString(),
    is_current: false,
  },
]

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}

function applyFontSize(size: FontSize) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.fontSize = size
}

function applyLanguage(lang: Language) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lang
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      profile: {
        first_name: '',
        last_name: '',
        email: '',
        avatar_url: null,
        bio: '',
      },
      preferences: {
        theme: 'system',
        language: 'en',
        font_size: 'medium',
        animations: true,
        notifications: true,
      },
      sessions: mockSessions,
      privacy: {
        profile_visibility: 'public',
        share_statistics: true,
      },
      remember_device: true,
      isSaving: false,
      message: null,

      setTheme: (theme: Theme) => {
        set((s) => ({ preferences: { ...s.preferences, theme } }))
        applyTheme(theme)
      },

      setLanguage: (language: Language) => {
        set((s) => ({ preferences: { ...s.preferences, language } }))
        applyLanguage(language)
      },

      setFontSize: (size: FontSize) => {
        set((s) => ({ preferences: { ...s.preferences, font_size: size } }))
        applyFontSize(size)
      },

      setAnimations: (enabled: boolean) => {
        set((s) => ({ preferences: { ...s.preferences, animations: enabled } }))
      },

      setNotifications: (enabled: boolean) => {
        set((s) => ({ preferences: { ...s.preferences, notifications: enabled } }))
      },

      updateProfile: (profile: Partial<UserProfile>) => {
        set((s) => ({ profile: { ...s.profile, ...profile } }))
      },

      setAvatar: (url: string | null) => {
        set((s) => ({ profile: { ...s.profile, avatar_url: url } }))
      },

      setPrivacy: (settings: Partial<PrivacySettings>) => {
        set((s) => ({ privacy: { ...s.privacy, ...settings } }))
      },

      setRememberDevice: (remember: boolean) => {
        set({ remember_device: remember })
      },

      logoutOtherSessions: (sessionIds: string[]) => {
        set((s) => ({
          sessions: s.sessions.filter(
            (session) => !sessionIds.includes(session.id)
          ),
        }))
        get().showMessage('success', 'Other sessions have been closed')
      },

      logoutAllSessions: () => {
        const currentSession = get().sessions.find((s) => s.is_current)
        set({
          sessions: currentSession ? [currentSession] : [],
        })
        get().showMessage('success', 'All other sessions have been closed')
      },

      clearChatHistory: async () => {
        set({ isSaving: true })
        await new Promise((r) => setTimeout(r, 1000))
        set({ isSaving: false })
        get().showMessage('success', 'Chat history has been cleared')
      },

      clearAllData: async () => {
        set({ isSaving: true })
        await new Promise((r) => setTimeout(r, 1500))
        set({ isSaving: false })
        get().showMessage('success', 'All data has been deleted')
      },

      showMessage: (type, text) => {
        set({ message: { type, text } })
        setTimeout(() => {
          set({ message: null })
        }, 4000)
      },

      clearMessage: () => set({ message: null }),
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        profile: state.profile,
        preferences: state.preferences,
        privacy: state.privacy,
        remember_device: state.remember_device,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.preferences.theme)
          applyFontSize(state.preferences.font_size)
          applyLanguage(state.preferences.language)
        }
      },
    }
  )
)
