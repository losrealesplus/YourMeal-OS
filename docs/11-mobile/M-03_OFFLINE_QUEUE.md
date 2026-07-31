# M-03 · Offline Queue (spec)

**Estado:** ✅ **IMPLEMENTED** (infraestructura · 2026-07-31) · sin Sync Engine  
**Depende de:** [M-04 StorageProvider](./M-04_STORAGEPROVIDER.md)  
**ADR:** [0033 Platform Independence](../adr/0033-platform-independence.md) · [0008 Offline-ready](../adr/0008-ai-offline-ready.md)  
**Padre:** [MF-001](./MF-001_MOBILE_FOUNDATION.md)  
**Guía:** [M-03_IMPLEMENTATION](./M-03_IMPLEMENTATION.md)  
**Código:** `src/platform/offline-queue/`

---

## Objetivo

Cola local (outbox) de operaciones pendientes de sincronizar.

```text
Feature / futuro Sync Engine
            ↓
       OfflineQueue
            ↓
      StorageProvider
            ↓
   Memory | Web | Capacitor
```

M-03 **no** habla con la red ni conoce reglas de cocina/reparto.  
Solo gestiona el **ciclo de vida** de comandos en cola. El drenado remoto es **M-06**.

---

## Entregables

| # | Entregable | Ubicación |
|---|------------|-----------|
| 1 | Contrato `OfflineQueue` + tipos | `types.ts` |
| 2 | Implementación persistente | `queue.ts` → StorageProvider |
| 3 | Resolver `getOfflineQueue()` | `resolve.ts` |
| 4 | Backoff / retries | `backoff.ts` |
| 5 | Feature flags nombrados | `flags.ts` |
| 6 | Tests | `offline-queue.spec.ts` |
| 7 | Docs | este spec + IMPLEMENTATION + CLOSED |

---

## Estados

| Status | Significado |
|--------|-------------|
| `pending` | Lista para claim (o reintento forzado) |
| `processing` | Claimed por un worker / Sync Engine |
| `completed` | Éxito local de procesamiento |
| `failed` | Fallo con reintentos restantes + `nextAttemptAt` |
| `dead` | Agotó `maxAttempts` |

Reservados para M-06 (no transicionados por M-03): `conflict` · `resolved`.

---

## Feature flags (nombres)

```text
offline.queue.enabled
offline.queue.maxAttempts
offline.sync.drainEnabled
```

Constantes: `OFFLINE_FEATURE_FLAGS` en código.  
Valores remotos / UI de flags → fase posterior; aquí quedan **nombrados**.

---

## Fuera de alcance

❌ Sync Engine / transporte Supabase (M-06)  
❌ Conflict resolver  
❌ SQLite schema operativo  
❌ Comandos de negocio (kitchen/delivery) encolados desde UI  
❌ Background execution (MF-002)

---

## Definition of Done

- [x] Cola con estados pending / processing / completed / failed (+ dead).  
- [x] Persistencia **solo** vía StorageProvider.  
- [x] API independiente del backend de storage.  
- [x] Reintentos con backoff básico.  
- [x] Preparada para Sync Engine (`dequeue` / mark*).  
- [x] Sin acoplar lógica de negocio.  
- [x] Tests + documentación.  
- [x] Feature flags `offline.*` nombrados.

---

## Relación

| ID | Tema | Estado |
|----|------|--------|
| M-04 | StorageProvider | ✅ (dependencia) |
| **M-03** | **Offline Queue** | ✅ IMPLEMENTED (infra) |
| M-06 | Sync Engine | Next |
