import { getStorageProvider } from "@/platform/storage-provider";
import { isSupportedLanguage, type LanguageCode } from "./languages";

export const LANG_STORAGE_KEY = "ymos.lang";

/**
 * Persist UI language via StorageProvider (never localStorage directly).
 */
export async function persistUiLanguage(code: LanguageCode): Promise<void> {
  try {
    await getStorageProvider().set(LANG_STORAGE_KEY, code);
  } catch {
    /* best-effort */
  }
}

/**
 * Read stored UI language. Returns null when missing / unsupported / SSR empty.
 */
export async function readStoredUiLanguage(): Promise<LanguageCode | null> {
  try {
    const raw = await getStorageProvider().get(LANG_STORAGE_KEY);
    if (raw && isSupportedLanguage(raw)) return raw;
    return null;
  } catch {
    return null;
  }
}

/**
 * Apply stored language preference to i18n (client hydrate).
 */
export async function hydrateUiLanguage(
  changeLanguage: (lng: string) => Promise<unknown>,
): Promise<void> {
  const code = await readStoredUiLanguage();
  if (!code) return;
  await changeLanguage(code);
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("lang", code);
  }
}
