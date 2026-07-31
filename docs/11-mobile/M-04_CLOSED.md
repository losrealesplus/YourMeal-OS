# M-04 · CLOSED — StorageProvider Infrastructure

**Estado:** ✅ **CLOSED**  
**Fecha de cierre:** 2026-07-31  
**Código:** `src/platform/storage-provider/`  
**Spec:** [M-04_STORAGEPROVIDER](./M-04_STORAGEPROVIDER.md) · [IMPLEMENTATION](./M-04_IMPLEMENTATION.md)  
**ADR:** [0033](../adr/0033-platform-independence.md)  
**Plugin:** `@capacitor/preferences@8.0.1`

---

## Objetivo (cumplido)

Capa única de persistencia: el dominio no depende de localStorage ni de Capacitor Preferences.

---

## Evidencias DoD

| Criterio | Evidencia |
|----------|-----------|
| Sin `localStorage` en módulos de producto | Grep: solo `web-adapter.ts` |
| Sin Preferences en dominio | Solo `capacitor-adapter.ts` |
| Único acceso | `getStorageProvider()` |
| Web / Capacitor / SSR | Resolver + memory fallback |
| Sesión Auth vía puerto | `createSupabaseAuthStorage()` en supabase client |
| Preferencias idioma | `persistUiLanguage` / `hydrateUiLanguage` |
| Tests | `storage-provider.spec.ts` |
| Docs | Spec + Implementation + este CLOSED |

---

## Siguiente

**M-03 · Offline Queue** — se construye sobre StorageProvider.  
Luego M-06 Sync Engine.
