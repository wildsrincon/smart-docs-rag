import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AppLanguage = 'en' | 'es'

interface LanguageState {
  language: AppLanguage
  detectedLanguage: AppLanguage
  setLanguage: (lang: AppLanguage) => void
  setDetectedLanguage: (lang: AppLanguage) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      detectedLanguage: 'en',

      setLanguage: (language) => {
        set({ language })
        if (typeof document !== 'undefined') {
          document.documentElement.lang = language
        }
      },

      setDetectedLanguage: (detectedLanguage) => {
        set({ detectedLanguage, language: detectedLanguage })
        if (typeof document !== 'undefined') {
          document.documentElement.lang = detectedLanguage
        }
      },
    }),
    {
      name: 'language-storage',
      partialize: (state) => ({
        language: state.language,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== 'undefined') {
          document.documentElement.lang = state.language
        }
      },
    }
  )
)
