/**
 * M-03 · Offline Queue — reliable operation outbox for EatClean beta.
 *
 * Stores opaque intents only. Never imports Supabase, HTTP clients,
 * or domain services. Execution belongs to a later Sync / use-case layer.
 */

/** Beta lifecycle — keep this set small. */
export type QueueItemStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type QueueItemPayload = Record<string, unknown>;

/**
 * Single queue row. Intentionally minimal for the beta.
 */
export interface QueueItem {
  id: string;
  /** Opaque intent name, e.g. "CrearPedido" — queue does not interpret it. */
  type: string;
  payload: QueueItemPayload;
  createdAt: string;
  status: QueueItemStatus;
  /** Number of failed attempts so far. */
  retryCount: number;
}

export interface EnqueueInput {
  type: string;
  payload?: QueueItemPayload;
  /** Optional stable id for idempotent enqueue. */
  id?: string;
}

export interface OfflineQueueListFilter {
  status?: QueueItemStatus | QueueItemStatus[];
}

/**
 * Persistent operation queue.
 * Persists exclusively through StorageProvider.
 */
export interface OfflineQueue {
  enqueue(input: EnqueueInput): Promise<QueueItem>;
  get(id: string): Promise<QueueItem | null>;
  list(filter?: OfflineQueueListFilter): Promise<QueueItem[]>;
  /**
   * Claim the oldest `pending` item and mark it `processing`.
   * Returns null when nothing is pending.
   */
  dequeue(): Promise<QueueItem | null>;
  /** Mark as completed (caller may `remove` afterwards on 200 OK). */
  complete(id: string): Promise<QueueItem>;
  /** Mark as failed; item stays in the queue for a later `retry`. */
  fail(id: string): Promise<QueueItem>;
  /** Move a `failed` item back to `pending` for another attempt. */
  retry(id: string): Promise<QueueItem>;
  /** Delete an item (typical after successful remote execution). */
  remove(id: string): Promise<boolean>;
}

export interface OfflineQueueOptions {
  storageKey?: string;
  now?: () => Date;
  createId?: () => string;
}
