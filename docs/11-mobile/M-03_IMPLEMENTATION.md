# M-03 · Offline Queue — Implementation Guide

**Código:** `src/platform/offline-queue/`  
**Spec:** [M-03_OFFLINE_QUEUE](./M-03_OFFLINE_QUEUE.md)

---

## Uso

```ts
import { getOfflineQueue } from "@/platform/offline-queue";

const queue = getOfflineQueue();

// Encolar intención (UI / caso de uso) — sin llamar a la API todavía
await queue.enqueue({
  type: "CrearPedido",
  payload: { draftId: "…" },
  id: "op-stable-id", // opcional · idempotente
});

// Más adelante (Sync Engine / worker):
const next = await queue.dequeue();
if (!next) return;

try {
  // El ejecutor conoce el type — la cola no
  await executeIntent(next);
  await queue.complete(next.id);
  await queue.remove(next.id); // 200 OK → desaparece
} catch {
  await queue.fail(next.id);   // permanece para retry
}

// Reintento manual / ciclo posterior:
const failed = await queue.list({ status: "failed" });
for (const item of failed) {
  await queue.retry(item.id);
}
```

---

## Persistencia

Clave: `ymos.offline.queue.v1`  
Formato: `{ version: 1, items: QueueItem[] }`  
I/O: **solo** `StorageProvider`.

---

## Separación de responsabilidades

| Capa | Responsabilidad |
|------|-----------------|
| Offline Queue | *Qué* operación está pendiente |
| Caso de uso / Sync (M-06) | *Cómo* se ejecuta contra API/Supabase |

**Prohibido** dentro de `src/platform/offline-queue/`:

```ts
supabase.from(...)
fetch(...)
```

---

## Tests

`offline-queue.spec.ts` cubre: enqueue · dequeue · remove · retry · persistencia · restauración.

---

## Fuera de alcance

Sync automático · SW · Background Sync · conflictos · prioridades · WebSockets.
