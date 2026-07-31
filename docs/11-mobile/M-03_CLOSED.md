# M-03 · CLOSED — Offline Queue Infrastructure

**Estado:** ✅ **CLOSED**  
**Fecha de cierre:** 2026-07-31  
**Código:** `src/platform/offline-queue/`  
**Spec:** [M-03_OFFLINE_QUEUE](./M-03_OFFLINE_QUEUE.md) · [IMPLEMENTATION](./M-03_IMPLEMENTATION.md)  
**Depende de:** [M-04 StorageProvider](./M-04_STORAGEPROVIDER.md)

---

## Objetivo (cumplido)

Cola local (outbox) con ciclo de vida y retries, persistida únicamente vía StorageProvider, lista para que M-06 la drene.

---

## Evidencias DoD

| Criterio | Evidencia |
|----------|-----------|
| Estados | `pending` · `processing` · `completed` · `failed` · `dead` |
| Persistencia StorageProvider | `createOfflineQueue(storage)` |
| API agnóstica | `getOfflineQueue()` / `OfflineQueue` |
| Retries + backoff | `markFailed` · `computeBackoffMs` |
| Sin sync de negocio | Sin imports Supabase / kitchen |
| Flags nombrados | `OFFLINE_FEATURE_FLAGS` |
| Tests | `offline-queue.spec.ts` |
| Docs | Spec + Implementation + CLOSED |

---

## Siguiente

**M-06 · Sync Engine** — drenar la cola hacia remoto + conflictos.  
Validación funcional EatClean sobre la base M-01…M-04 (+ cola lista).
