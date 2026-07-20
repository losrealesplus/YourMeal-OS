import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import { resources } from "./locales";
import { DEFAULT_LNG, SUPPORTED_LNGS } from "./languages";

export const LANG_STORAGE_KEY = "ymos.lang";

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: DEFAULT_LNG,
      supportedLngs: SUPPORTED_LNGS,
      load: "languageOnly",
      nonExplicitSupportedLngs: true,
      defaultNS: "common",
      ns: ["common", "auth", "customer", "admin"],
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator", "htmlTag"],
        lookupLocalStorage: LANG_STORAGE_KEY,
        caches: ["localStorage"],
      },
    });
}

export default i18n;
export {
  LANGUAGES,
  SUPPORTED_LNGS,
  DEFAULT_LNG,
  isSupportedLanguage,
  getLanguage,
} from "./languages";
export type { LanguageCode, Language } from "./languages";
