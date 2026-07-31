/**
 * M-03 · Offline Queue — local outbox lifecycle.
 *
 * Persists only via StorageProvider. Does not talk to the network —
 * M-06 Sync Engine will drain this queue later.
 */

/** Lifecycle states for a queued command (product-facing names). */
export type OfflineCommandStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "dead";

/**
 * Reserved for M-06 conflict handling. Present so the model can evolve
 * without renaming statuses later — M-03 never transitions here by itself.
 */
export type OfflineCommandExtendedStatus =
  | OfflineCommandStatus
  | "conflict"
  | "resolved";

export type OfflineCommandPayload = Record<string, unknown>;

export interface OfflineCommand {
  /** Stable idempotency key (caller-supplied or generated). */
  id: string;
  /** Domain command type, e.g. "kitchen.mark_prepared" — opaque to the queue. */
  type: string;
  payload: OfflineCommandPayload;
  /** Higher = drained sooner when a sync engine sorts. Default 0. */
  priority: number;
  status: OfflineCommandStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  /** ISO timestamp when the command becomes eligible again after backoff. */
  nextAttemptAt: string | null;
  lastError: string | null;
}

export interface EnqueueCommandInput {
  type: string;
  payload?: OfflineCommandPayload;
  /** Optional stable id for idempotent enqueue. */
  id?: string;
  priority?: number;
  maxAttempts?: number;
}

export interface OfflineQueueListFilter {
  status?: OfflineCommandStatus | OfflineCommandStatus[];
  /** When true (default), only items whose nextAttemptAt is null or <= now. */
  dueOnly?: boolean;
}

export interface OfflineQueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  dead: number;
  total: number;
}

/**
 * Port consumed by application / future Sync Engine.
 * Never import StorageProvider adapters from business code — inject or use
 * `getOfflineQueue()`.
 */
export interface OfflineQueue {
  enqueue(input: EnqueueCommandInput): Promise<OfflineCommand>;
  get(id: string): Promise<OfflineCommand | null>;
  list(filter?: OfflineQueueListFilter): Promise<OfflineCommand[]>;
  /**
   * Claim the next due pending command (highest priority, oldest first).
   * Marks it `processing`. Returns null when the queue is empty / not due.
   */
  dequeue(): Promise<OfflineCommand | null>;
  markProcessing(id: string): Promise<OfflineCommand>;
  markCompleted(id: string): Promise<OfflineCommand>;
  /**
   * Record failure. Schedules retry with backoff when attempts remain;
   * otherwise moves to `dead`.
   */
  markFailed(id: string, error: string): Promise<OfflineCommand>;
  /** Force a pending retry now (clears nextAttemptAt). */
  retryNow(id: string): Promise<OfflineCommand>;
  remove(id: string): Promise<boolean>;
  clearCompleted(): Promise<number>;
  stats(): Promise<OfflineQueueStats>;
}

export interface OfflineQueueOptions {
  /** Storage key for the serialized outbox. */
  storageKey?: string;
  /** Default max attempts for new commands. */
  defaultMaxAttempts?: number;
  /** Base delay (ms) for exponential backoff. */
  baseBackoffMs?: number;
  /** Cap for backoff delay (ms). */
  maxBackoffMs?: number;
  /** Clock injection for tests. */
  now?: () => Date;
  /** Id generator injection for tests. */
  createId?: () => string;
}
