import { useLanguage } from "@/lib/contexts/language-context"

/**
 * Hook to access translations
 * @param key - Translation key (supports nested keys like "common.welcome" or "dashboard.title")
 * @returns Translated string
 * 
 * @example
 * const t = useTranslation()
 * const welcomeText = t("common.welcome")
 * const dashboardTitle = t("dashboard.title")
 */
export function useTranslation() {
  const { t } = useLanguage()
  return t
}

