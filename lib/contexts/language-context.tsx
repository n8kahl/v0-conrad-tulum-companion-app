"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { translations, type Locale, type TranslationKey } from "@/lib/i18n/translations"

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
  getLocalizedUrl: (urls: Record<string, string | undefined>, baseKey: string) => string | null
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = "conrad-language-preference"

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored && (stored === "en" || stored === "es")) {
      setLocaleState(stored)
    }
    setIsHydrated(true)
  }, [])

  // Save to localStorage when changed
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(STORAGE_KEY, newLocale)
  }, [])

  // Translation function
  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[locale][key] || translations.en[key] || key
    },
    [locale]
  )

  // Get localized URL from asset.urls object
  // Tries: flipbook_en/flipbook_es, pdf_en/pdf_es, then falls back to base key
  const getLocalizedUrl = useCallback(
    (urls: Record<string, string | undefined>, baseKey: string): string | null => {
      if (!urls) return null

      // Try language-specific key first (e.g., flipbook_en, flipbook_es)
      const localizedKey = `${baseKey}_${locale}`
      if (urls[localizedKey]) {
        return urls[localizedKey] as string
      }

      // Try opposite language as fallback
      const oppositeLocale = locale === "en" ? "es" : "en"
      const oppositeKey = `${baseKey}_${oppositeLocale}`
      if (urls[oppositeKey]) {
        return urls[oppositeKey] as string
      }

      // Try base key without language suffix (e.g., just "flipbook")
      if (urls[baseKey]) {
        return urls[baseKey] as string
      }

      return null
    },
    [locale]
  )

  // Prevent hydration mismatch by not rendering until client-side
  if (!isHydrated) {
    return (
      <LanguageContext.Provider
        value={{
          locale: "en",
          setLocale: () => {},
          t: (key) => translations.en[key] || key,
          getLocalizedUrl: () => null,
        }}
      >
        {children}
      </LanguageContext.Provider>
    )
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, getLocalizedUrl }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
