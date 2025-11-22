"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { LanguageCode, translations, languageNames } from "@/lib/translations"

interface LanguageContextType {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  t: (key: string) => string
  availableLanguages: { code: LanguageCode; name: string }[]
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = "pib-platform-language"

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en")

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem(STORAGE_KEY) as LanguageCode
    if (savedLanguage && translations[savedLanguage]) {
      setLanguageState(savedLanguage)
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.split("-")[0] as LanguageCode
      if (translations[browserLang]) {
        setLanguageState(browserLang)
      }
    }
  }, [])

  // Save language to localStorage when it changes
  const setLanguage = useCallback((lang: LanguageCode) => {
    console.log("Setting language to:", lang, "Available:", Object.keys(translations))
    if (translations[lang]) {
      setLanguageState(lang)
      localStorage.setItem(STORAGE_KEY, lang)
      // Update HTML lang attribute
      if (typeof document !== "undefined") {
        document.documentElement.lang = lang
      }
    } else {
      console.error(`Language ${lang} not found in translations. Available languages:`, Object.keys(translations))
    }
  }, [])

  // Update HTML lang attribute when language changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language
    }
  }, [language])

  // Translation function with nested key support (e.g., "common.welcome" or "dashboard.title")
  const t = useCallback(
    (key: string): string => {
      try {
        const keys = key.split(".")
        let value: any = translations[language]

        // Navigate through nested keys
        for (const k of keys) {
          if (value && typeof value === "object" && k in value) {
            value = value[k]
          } else {
            // Fallback to English if key not found in current language
            value = translations.en
            for (const fallbackKey of keys) {
              if (value && typeof value === "object" && fallbackKey in value) {
                value = value[fallbackKey]
              } else {
                console.warn(`Translation key not found: ${key} (language: ${language})`)
                return key // Return key if not found even in English
              }
            }
            break
          }
        }

        // Ensure we return a string
        if (typeof value === "string") {
          return value
        } else {
          console.warn(`Translation value is not a string for key: ${key} (language: ${language})`)
          return key
        }
      } catch (error) {
        console.error(`Translation error for key: ${key} (language: ${language}):`, error)
        return key
      }
    },
    [language],
  )

  const availableLanguages = React.useMemo(
    () =>
      Object.entries(languageNames).map(([code, name]) => ({
        code: code as LanguageCode,
        name,
      })),
    [],
  )

  const contextValue = React.useMemo(
    () => ({
      language,
      setLanguage,
      t,
      availableLanguages,
    }),
    [language, setLanguage, t, availableLanguages],
  )

  return (
    <LanguageContext.Provider value={contextValue}>
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