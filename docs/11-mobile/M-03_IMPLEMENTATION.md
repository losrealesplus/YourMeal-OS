# M-03 · Offline Queue — Implementation Guide

**Código:** `src/platform/offline-queue/`  
**Spec:** [M-03_OFFLINE_QUEUE](./M-03_OFFLINE_QUEUE.md)

---

## Uso

```ts
import { getOfflineQueue } from "@/platform/offline-queue";

const queue = getOfflineQueue();

await queue.enqueue({
  type: "kitchen.mark_prepared",
  payload: { productionItemId: "…" },
  priority: 10,
  id: "stable-command-id", // optional · idempotent
});

const next = await queue.dequeue();
if (next) {
  try {
    // M-06 will perform remote sync here.
    await queue.markCompleted(next.id);
  } catch (err) {
    await queue.markFailed(next.id, String(err));
  }
}
```

**Tests:**

```ts
import {
  createOfflineQueue,
  setOfflineQueueForTests,
} from "@/platform/offline-queue";
import { createMemoryStorageProvider } from "@/platform/storage-provider";

const queue = createOfflineQueue(createMemoryStorageProvider());
setOfflineQueueForTests(queue);
```

---

## Persistencia

Clave por defecto: `ymos.offline.queue.v1` (JSON `{ version: 1, commands: [...] }`).

Todo I/O pasa por `StorageProvider` — cambiar Web → Capacitor → futuro SQLite **no** cambia la API de la cola.

---

## Retries

Tras `markFailed`:

1. Si `attempts < maxAttempts` → `failed` + `nextAttemptAt` (backoff exponencial + jitter).  
2. Si no → `dead`.

`retryNow(id)` limpia el backoff y vuelve a `pending`.

Defaults: `maxAttempts=5`, `baseBackoffMs=1000`, `maxBackoffMs=60000`.

---

## Relación con M-06

| M-03 | M-06 |
|------|------|
| Outbox + estados + retries | Transporte remoto + conflictos + ack |
| `dequeue` / `mark*` | Loop de drain + policy por comando |
| No conoce Supabase | Habla con API / Sync port |

---

## Feature flags

```ts
import { OFFLINE_FEATURE_FLAGS } from "@/platform/offline-queue";
// offline.queue.enabled · offline.queue.maxAttempts · offline.sync.drainEnabled
```

---

## Fuera de alcance

Sync remoto · conflictos · SQLite · encolar desde pantallas de producto · background.
