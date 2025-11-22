"use client"

import { useLanguage } from "@/lib/contexts/language-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface LanguageSelectorProps {
  variant?: "select" | "dropdown"
  showLabel?: boolean
}

export function LanguageSelector({ variant = "select", showLabel = false }: LanguageSelectorProps) {
  const { language, setLanguage, availableLanguages, t } = useLanguage()
  const { toast } = useToast()

  const handleLanguageChange = (newLanguage: string) => {
    console.log("Language changing from", language, "to", newLanguage)
    const langName = availableLanguages.find((l) => l.code === newLanguage)?.name || newLanguage
    setLanguage(newLanguage as any)
    toast({
      title: t("common.success"),
      description: `${t("common.language")} changed to ${langName}`,
      duration: 2000,
    })
  }

  if (variant === "dropdown") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">{availableLanguages.find((l) => l.code === language)?.name || "English"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-[100] max-h-[300px] overflow-y-auto">
          {availableLanguages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onSelect={(e) => {
                e.preventDefault()
                handleLanguageChange(lang.code)
              }}
              className={language === lang.code ? "bg-accent font-semibold" : "cursor-pointer"}
            >
              {lang.name}
              {language === lang.code && (
                <span className="ml-auto text-xs">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <label className="text-sm font-medium">{t("common.language")}:</label>
      )}
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[140px] sm:w-[160px]">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <SelectValue placeholder={t("common.language")} />
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[300px] z-[100]">
          {availableLanguages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}