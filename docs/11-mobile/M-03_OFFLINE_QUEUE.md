# M-03 · Offline Queue (spec)

**Estado:** ✅ **IMPLEMENTED** (beta infra · 2026-07-31)  
**Depende de:** [M-04 StorageProvider](./M-04_STORAGEPROVIDER.md)  
**ADR:** [0033 Platform Independence](../adr/0033-platform-independence.md)  
**Padre:** [MF-001](./MF-001_MOBILE_FOUNDATION.md)  
**Guía:** [M-03_IMPLEMENTATION](./M-03_IMPLEMENTATION.md)  
**Código:** `src/platform/offline-queue/`

---

## Objetivo

Cola **fiable de operaciones** para que EatClean no pierda acciones del usuario cuando no hay red o la API falla.

No es sincronización offline completa. Es un outbox de intenciones.

```text
UI → OfflineQueue → StorageProvider
         ↑
   (más adelante)
         ↓
   Sync / caso de uso → API
```

---

## Modelo `QueueItem`

| Campo | Rol |
|-------|-----|
| `id` | Identificador estable |
| `type` | Intención opaca (`CrearPedido`, …) |
| `payload` | Datos JSON de la intención |
| `createdAt` | ISO timestamp |
| `status` | `pending` \| `processing` \| `completed` \| `failed` |
| `retryCount` | Fallos acumulados |

**Nada más** en la beta.

---

## Contrato

```ts
getOfflineQueue()
enqueue · dequeue · complete · fail · retry · remove · get · list
```

La cola **no conoce** Supabase, HTTP ni reglas de negocio.

---

## Fuera de alcance

❌ Background Sync · Service Workers · Push · WebSockets  
❌ Conflict resolution · merge · sync automático  
❌ Prioridades · compresión · estado `dead`  
❌ Backoff temporal automático  

---

## Definition of Done

- [x] Cola persistente vía StorageProvider  
- [x] Sobrevive al cierre de la app (mismo storage)  
- [x] Reintentos básicos (`fail` → `retry`)  
- [x] Independiente de Web / Capacitor  
- [x] Tests + documentación  
- [x] Sin acoplamiento a Supabase  

---

## Relación

| ID | Estado |
|----|--------|
| M-04 StorageProvider | ✅ dependencia |
| **M-03 Offline Queue** | ✅ IMPLEMENTED (beta) |
| M-06 Sync Engine | Next (ejecuta intenciones) |
