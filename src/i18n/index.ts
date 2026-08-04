import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import { resources } from "./locales";
import { DEFAULT_LNG, SUPPORTED_LNGS } from "./languages";
import { LANG_STORAGE_KEY } from "./ui-language-storage";

export { LANG_STORAGE_KEY };

/**
 * Client SPA (Capacitor) and browser must always run this init.
 * Marked as a package sideEffect (see package.json) so production
 * tree-shaking cannot drop resources / fallbackLng from the client bundle.
 */
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
      ns: ["common", "auth", "customer", "admin", "branding"],
      interpolation: { escapeValue: false },
      // Sync resource store for first paint (Capacitor SPA has no SSR HTML).
      initImmediate: true,
      react: { useSuspense: false },
      detection: {
        // Language persistence goes through StorageProvider (M-04), not localStorage.
        // See hydrateUiLanguage / persistUiLanguage in ui-language-storage.ts.
        order: ["navigator", "htmlTag"],
        caches: [],
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
export {
  hydrateUiLanguage,
  persistUiLanguage,
  readStoredUiLanguage,
} from "./ui-language-storage";
