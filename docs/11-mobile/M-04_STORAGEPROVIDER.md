# M-04 · StorageProvider (spec)

**Estado:** ✅ **IMPLEMENTED** (2026-07-31)  
**Depende de:** [M-01 CLOSED](./M-01_CLOSED.md) · [M-02 DeviceCapabilities](./M-02_DEVICECAPABILITIES.md)  
**ADR:** [0033 Platform Independence](../adr/0033-platform-independence.md)  
**Padre:** [MF-001](./MF-001_MOBILE_FOUNDATION.md)  
**Guía:** [M-04_IMPLEMENTATION](./M-04_IMPLEMENTATION.md)  
**Código:** `src/platform/storage-provider/`

---

## Objetivo

Crear una **única capa de acceso al almacenamiento** para toda la aplicación.

El dominio y la UI **no saben** si los datos viven en:

* localStorage (Web)
* Capacitor Preferences (Android / iOS)
* Memory (SSR / fallback)
* futuros: Secure Storage · SQLite · IndexedDB

```text
Feature → StorageProvider → Adapter → (Web | Capacitor | Memory)
```

M-04 **no** añade UX nueva: solo infraestructura de persistencia estable para la beta móvil y para que **M-03 Offline Queue** se apoye en ella.

---

## Entregables

| # | Entregable | Ubicación |
|---|------------|-----------|
| 1 | Contrato `StorageProvider` | `contract.ts` |
| 2 | Memory Adapter (SSR) | `memory-adapter.ts` |
| 3 | Web Adapter (`localStorage`) | `web-adapter.ts` |
| 4 | Capacitor Adapter (`@capacitor/preferences`) | `capacitor-adapter.ts` |
| 5 | Resolver `getStorageProvider()` | `resolve.ts` |
| 6 | Bridge Supabase Auth | `supabase-auth-storage.ts` |
| 7 | Tests | `storage-provider.spec.ts` |
| 8 | Documentación | este spec + IMPLEMENTATION + CLOSED |

---

## API (mínima)

```ts
interface StorageProvider {
  readonly backend: "memory" | "web" | "capacitor";
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}
```

Async por diseño: Preferences es asíncrono; Web envuelve localStorage en Promises.

---

## Fuera de alcance (explícito)

❌ Secure Storage · SQLite · IndexedDB  
❌ Cifrado · sincronización · caché de red  
❌ Offline Queue (M-03) · Sync Engine (M-06)  

---

## Migraciones de call sites (DoD)

| Antes | Después |
|-------|---------|
| `localStorage` en auth onboarding | `getStorageProvider()` |
| `localStorage` en language sync / selectors | `persistUiLanguage` / `hydrateUiLanguage` |
| Supabase `auth.storage: localStorage` | `createSupabaseAuthStorage()` |
| i18next `caches: ["localStorage"]` | `caches: []` + StorageProvider helpers |

**Nota:** `sessionStorage` en bootstrap mode (`ymos_bootstrap_profile_id`) permanece fuera de este puerto — es efímero / solo desarrollo, no persistencia de producto.

---

## Definition of Done

- [x] Ningún módulo de producto accede directamente a `localStorage`.  
- [x] Ningún módulo accede directamente a Capacitor Preferences.  
- [x] Único punto de entrada: `getStorageProvider()`.  
- [x] Resolver automático Web / Capacitor / Memory (SSR).  
- [x] Tests PASS.  
- [x] Documentación.  
- [x] Compatible con SSR (memory backend).  

---

## Relación

| ID | Tema | Estado |
|----|------|--------|
| M-01 | Capacitor infra | ✅ CLOSED |
| M-02 | DeviceCapabilities | ✅ CLOSED |
| **M-04** | **StorageProvider** | ✅ IMPLEMENTED |
| M-03 | Offline Queue | Next (después de M-04) |
| M-06 | Sync Engine | Pending |
