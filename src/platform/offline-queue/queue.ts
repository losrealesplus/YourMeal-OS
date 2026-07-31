import type { StorageProvider } from "@/platform/storage-provider";
import { computeBackoffMs, resolveQueueOptions } from "./backoff";
import type {
  EnqueueCommandInput,
  OfflineCommand,
  OfflineCommandStatus,
  OfflineQueue,
  OfflineQueueListFilter,
  OfflineQueueOptions,
  OfflineQueueStats,
} from "./types";

type PersistedShape = {
  version: 1;
  commands: OfflineCommand[];
};

function emptyStats(): OfflineQueueStats {
  return {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    dead: 0,
    total: 0,
  };
}

function asStatusList(
  status: OfflineCommandStatus | OfflineCommandStatus[] | undefined,
): OfflineCommandStatus[] | null {
  if (!status) return null;
  return Array.isArray(status) ? status : [status];
}

function isDue(cmd: OfflineCommand, nowIso: string): boolean {
  if (cmd.status !== "pending" && cmd.status !== "failed") return false;
  if (!cmd.nextAttemptAt) return cmd.status === "pending" || cmd.status === "failed";
  return cmd.nextAttemptAt <= nowIso;
}

function isClaimable(cmd: OfflineCommand, nowIso: string): boolean {
  return (
    (cmd.status === "pending" || cmd.status === "failed") && isDue(cmd, nowIso)
  );
}

function sortForDrain(a: OfflineCommand, b: OfflineCommand): number {
  if (b.priority !== a.priority) return b.priority - a.priority;
  return a.createdAt.localeCompare(b.createdAt);
}

/**
 * Creates an OfflineQueue bound to a StorageProvider.
 * Domain code should prefer `getOfflineQueue()` unless injecting for tests.
 */
export function createOfflineQueue(
  storage: StorageProvider,
  options: OfflineQueueOptions = {},
): OfflineQueue {
  const opts = resolveQueueOptions(options);

  async function load(): Promise<OfflineCommand[]> {
    const raw = await storage.get(opts.storageKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as PersistedShape;
      if (parsed?.version !== 1 || !Array.isArray(parsed.commands)) return [];
      return parsed.commands;
    } catch {
      return [];
    }
  }

  async function save(commands: OfflineCommand[]): Promise<void> {
    const body: PersistedShape = { version: 1, commands };
    await storage.set(opts.storageKey, JSON.stringify(body));
  }

  async function update(
    id: string,
    mutator: (cmd: OfflineCommand, nowIso: string) => OfflineCommand,
  ): Promise<OfflineCommand> {
    const commands = await load();
    const index = commands.findIndex((c) => c.id === id);
    if (index < 0) {
      throw new Error(`OfflineQueue: command not found: ${id}`);
    }
    const nowIso = opts.now().toISOString();
    const next = mutator(commands[index]!, nowIso);
    commands[index] = next;
    await save(commands);
    return next;
  }

  const queue: OfflineQueue = {
    async enqueue(input: EnqueueCommandInput): Promise<OfflineCommand> {
      if (!input.type?.trim()) {
        throw new Error("OfflineQueue: type is required");
      }

      const commands = await load();
      const id = input.id?.trim() || opts.createId();
      const existing = commands.find((c) => c.id === id);
      if (existing) {
        // Idempotent enqueue — return existing row unchanged.
        return existing;
      }

      const nowIso = opts.now().toISOString();
      const command: OfflineCommand = {
        id,
        type: input.type.trim(),
        payload: input.payload ?? {},
        priority: input.priority ?? 0,
        status: "pending",
        attempts: 0,
        maxAttempts: input.maxAttempts ?? opts.defaultMaxAttempts,
        createdAt: nowIso,
        updatedAt: nowIso,
        nextAttemptAt: null,
        lastError: null,
      };

      commands.push(command);
      await save(commands);
      return command;
    },

    async get(id) {
      const commands = await load();
      return commands.find((c) => c.id === id) ?? null;
    },

    async list(filter: OfflineQueueListFilter = {}) {
      const commands = await load();
      const statuses = asStatusList(filter.status);
      const nowIso = opts.now().toISOString();
      const dueOnly = filter.dueOnly === true;

      return commands
        .filter((c) => {
          if (statuses && !statuses.includes(c.status)) return false;
          if (dueOnly && !isDue(c, nowIso)) return false;
          return true;
        })
        .slice()
        .sort(sortForDrain);
    },

    async dequeue() {
      const commands = await load();
      const nowIso = opts.now().toISOString();
      const next = commands
        .filter((c) => isClaimable(c, nowIso))
        .sort(sortForDrain)[0];

      if (!next) return null;

      return queue.markProcessing(next.id);
    },

    async markProcessing(id) {
      return update(id, (cmd, nowIso) => {
        if (
          cmd.status !== "pending" &&
          cmd.status !== "failed" &&
          cmd.status !== "processing"
        ) {
          throw new Error(
            `OfflineQueue: cannot process command in status ${cmd.status}`,
          );
        }
        // Idempotent re-entry while already processing (crash recovery).
        if (cmd.status === "processing") {
          return { ...cmd, updatedAt: nowIso };
        }
        return {
          ...cmd,
          status: "processing",
          attempts: cmd.attempts + 1,
          updatedAt: nowIso,
          nextAttemptAt: null,
        };
      });
    },

    async markCompleted(id) {
      return update(id, (cmd, nowIso) => {
        if (cmd.status !== "processing" && cmd.status !== "pending") {
          throw new Error(
            `OfflineQueue: cannot complete command in status ${cmd.status}`,
          );
        }
        return {
          ...cmd,
          status: "completed",
          updatedAt: nowIso,
          nextAttemptAt: null,
          lastError: null,
        };
      });
    },

    async markFailed(id, error) {
      return update(id, (cmd, nowIso) => {
        if (cmd.status !== "processing" && cmd.status !== "pending") {
          throw new Error(
            `OfflineQueue: cannot fail command in status ${cmd.status}`,
          );
        }

        const attempts = Math.max(cmd.attempts, 1);
        if (attempts >= cmd.maxAttempts) {
          return {
            ...cmd,
            status: "dead",
            attempts,
            updatedAt: nowIso,
            nextAttemptAt: null,
            lastError: error,
          };
        }

        const delay = computeBackoffMs(
          attempts,
          opts.baseBackoffMs,
          opts.maxBackoffMs,
        );
        const nextAt = new Date(opts.now().getTime() + delay).toISOString();

        return {
          ...cmd,
          status: "failed",
          attempts,
          updatedAt: nowIso,
          nextAttemptAt: nextAt,
          lastError: error,
        };
      });
    },

    async retryNow(id) {
      return update(id, (cmd, nowIso) => {
        if (cmd.status === "completed" || cmd.status === "dead") {
          throw new Error(
            `OfflineQueue: cannot retry command in status ${cmd.status}`,
          );
        }
        if (cmd.status === "processing") {
          throw new Error("OfflineQueue: command is already processing");
        }
        return {
          ...cmd,
          status: "pending",
          updatedAt: nowIso,
          nextAttemptAt: null,
        };
      });
    },

    async remove(id) {
      const commands = await load();
      const next = commands.filter((c) => c.id !== id);
      if (next.length === commands.length) return false;
      await save(next);
      return true;
    },

    async clearCompleted() {
      const commands = await load();
      const next = commands.filter((c) => c.status !== "completed");
      const removed = commands.length - next.length;
      if (removed > 0) await save(next);
      return removed;
    },

    async stats() {
      const commands = await load();
      const stats = emptyStats();
      stats.total = commands.length;
      for (const c of commands) {
        stats[c.status] += 1;
      }
      return stats;
    },
  };

  return queue;
}
