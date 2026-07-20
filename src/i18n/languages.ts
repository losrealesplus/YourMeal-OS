export type LanguageCode = "en" | "es" | "de" | "fr" | "it" | "pt";

export type Language = {
  code: LanguageCode;
  name: string; // native name
  english: string;
  flag: string; // emoji flag
};

export const LANGUAGES: readonly Language[] = [
  { code: "en", name: "English", english: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", english: "Spanish", flag: "🇪🇸" },
  { code: "de", name: "Deutsch", english: "German", flag: "🇩🇪" },
  { code: "fr", name: "Français", english: "French", flag: "🇫🇷" },
  { code: "it", name: "Italiano", english: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Português", english: "Portuguese", flag: "🇵🇹" },
] as const;

export const SUPPORTED_LNGS: LanguageCode[] = LANGUAGES.map((l) => l.code);
export const DEFAULT_LNG: LanguageCode = "en";

export function isSupportedLanguage(v: unknown): v is LanguageCode {
  return typeof v === "string" && SUPPORTED_LNGS.includes(v as LanguageCode);
}

export function getLanguage(code: string): Language | undefined {
  return LANGUAGES.find((l) => l.code === code);
}
