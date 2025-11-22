import { en } from "./en"
import { hi } from "./hi"
import { bn } from "./bn"
import { ta } from "./ta"
import { te } from "./te"
import { gu } from "./gu"
import { mr } from "./mr"
import { kn } from "./kn"
import { ml } from "./ml"
import { or } from "./or"
import { pa } from "./pa"
import { as } from "./as"
import { ur } from "./ur"
import { ne } from "./ne"

export type LanguageCode = "en" | "hi" | "bn" | "ta" | "te" | "gu" | "mr" | "kn" | "ml" | "or" | "pa" | "as" | "ur" | "ne"

export type TranslationKey = keyof typeof en

export const translations = {
  en,
  hi,
  bn,
  ta,
  te,
  gu,
  mr,
  kn,
  ml,
  or,
  pa,
  as,
  ur,
  ne,
} as const

export const languageNames: Record<LanguageCode, string> = {
  en: "English",
  hi: "Hindi",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  gu: "Gujarati",
  mr: "Marathi",
  kn: "Kannada",
  ml: "Malayalam",
  or: "Odia",
  pa: "Punjabi",
  as: "Assamese",
  ur: "Urdu",
  ne: "Nepali",
}

export const languageCodes: LanguageCode[] = ["en", "hi", "bn", "ta", "te", "gu", "mr", "kn", "ml", "or", "pa", "as", "ur", "ne"]

