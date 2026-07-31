# M-03 · CLOSED — Offline Queue (Beta)

**Estado:** ✅ **CLOSED**  
**Fecha de cierre:** 2026-07-31  
**Código:** `src/platform/offline-queue/`  
**Spec:** [M-03_OFFLINE_QUEUE](./M-03_OFFLINE_QUEUE.md) · [IMPLEMENTATION](./M-03_IMPLEMENTATION.md)  
**Depende de:** [M-04](./M-04_STORAGEPROVIDER.md)

---

## Objetivo (cumplido)

Cola persistente de intenciones para la beta móvil EatClean, desacoplada de Supabase y de la plataforma.

---

## Evidencias DoD

| Criterio | Evidencia |
|----------|-----------|
| Cola persistente | `createOfflineQueue(storage)` + clave `ymos.offline.queue.v1` |
| Sobrevive cierre app | Restauración vía mismo StorageProvider |
| Solo StorageProvider | Sin `localStorage` / Preferences en el módulo |
| Reintentos básicos | `fail` + `retry` |
| Independiente Web/Capacitor | Resolver + StorageProvider |
| Modelo mínimo | `QueueItem`: id · type · payload · createdAt · status · retryCount |
| 4 estados | pending · processing · completed · failed |
| Sin Supabase | Módulo aislado · intents opacos |
| Tests + docs | `offline-queue.spec.ts` · SPEC · IMPLEMENTATION · CLOSED |

---

## Siguiente

**M-06 Sync Engine** (o ejecutor mínimo) — drenar intenciones hacia la API.  
Validación funcional EatClean sobre M-01…M-04 + esta cola.
