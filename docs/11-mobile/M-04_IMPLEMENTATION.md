# M-04 · StorageProvider — Implementation Guide

**Código:** `src/platform/storage-provider/`  
**Spec:** [M-04_STORAGEPROVIDER](./M-04_STORAGEPROVIDER.md)

---

## Uso

```ts
import { getStorageProvider } from "@/platform/storage-provider";

const storage = getStorageProvider();

await storage.set("tenant_onboarding_done", "1");
const value = await storage.get("tenant_onboarding_done");
await storage.remove("tenant_onboarding_done");
```

**Nunca** desde dominio / UI:

```ts
localStorage.setItem(...)
Preferences.set(...)
Capacitor.isNativePlatform() // para elegir storage
```

---

## Resolver

`getStorageProvider()` elige:

| Runtime | Backend |
|---------|---------|
| SSR (`window` undefined) | `memory` |
| Capacitor native shell | `capacitor` → `@capacitor/preferences` |
| Browser | `web` → `localStorage` |

Tests: `setStorageProviderForTests(provider)`.

---

## Supabase Auth

```ts
import { createSupabaseAuthStorage } from "@/platform/storage-provider";

auth: {
  storage: createSupabaseAuthStorage(),
  persistSession: true,
}
```

La sesión sobrevive cierre/reapertura de la app nativa porque Preferences persiste en el contenedor.

---

## Idioma (i18n)

Helpers en `@/i18n`:

* `persistUiLanguage(code)`
* `readStoredUiLanguage()`
* `hydrateUiLanguage(changeLanguage)`

i18next **no** escribe en `localStorage` (`caches: []`).

---

## Cómo añadir un nuevo adapter

1. Implementar `StorageProvider` en `src/platform/storage-provider/<name>-adapter.ts`.
2. Registrar la rama en `resolve.ts` (solo ahí se conoce la plataforma).
3. Añadir tests de contrato (get/set/remove/clear/has).
4. Documentar en este guide + actualizar DoD si cambia el alcance.

Ejemplos futuros: Secure Storage (tokens), SQLite (offline mirror), IndexedDB (blobs).

---

## Dependencia nativa

```json
"@capacitor/preferences": "8.0.1"
```

Tras instalar / actualizar plugins:

```bash
npm run sync:mobile
```

---

## Fuera de alcance

Secure Storage · SQLite · IndexedDB · cifrado · sync · offline queue.
