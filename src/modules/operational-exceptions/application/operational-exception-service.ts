import type { ServiceContext } from "@/services/types";
import { AuditService } from "@/services/audit-service";
import { DomainError } from "@/domain/errors";
import { requireCapability, hasStaffAccess } from "@/permissions";
import {
  canTransitionExceptionStatus,
  type OperationalException,
  type OperationalExceptionSeverity,
  type OperationalExceptionType,
  type ResolutionType,
} from "../domain/operational-exception";
import {
  createOperationalExceptionRepository,
  type OperationalExceptionRow,
} from "../infrastructure/operational-exception-repository";

export type CreateOperationalExceptionCommand = {
  type: OperationalExceptionType;
  severity?: OperationalExceptionSeverity;
  sourceDomain: string;
  sourceEntityType: string;
  sourceEntityId: string;
  orderId?: string | null;
  customerId?: string | null;
  companyId?: string | null;
  clientRequestId?: string;
};

export type ResolveOperationalExceptionCommand = {
  id: string;
  expectedVersion: number;
  resolutionType: ResolutionType;
  resolutionPayload?: Record<string, unknown>;
  resolutionNotes: string;
};

type IdempotencyEntry = {
  timestamp: number;
  resultPromise?: Promise<OperationalException>;
  result?: OperationalException;
};

const idempotencyStore = new Map<string, IdempotencyEntry>();

export function clearOperationalExceptionIdempotencyForTests(): void {
  idempotencyStore.clear();
}

export const OperationalExceptionService = {
  async createException(
    ctx: ServiceContext,
    command: CreateOperationalExceptionCommand,
  ): Promise<OperationalException> {
    if (!hasStaffAccess(ctx.roles)) {
      requireCapability(ctx.roles, "support.write");
    }

    if (
      !command.type ||
      !command.sourceDomain ||
      !command.sourceEntityType ||
      !command.sourceEntityId
    ) {
      throw new DomainError("INVALID_STATE", "Missing required exception parameters");
    }

    const idempotencyKey = command.clientRequestId?.trim()
      ? `${ctx.tenantId}:${command.clientRequestId.trim()}`
      : null;

    if (idempotencyKey) {
      const existing = idempotencyStore.get(idempotencyKey);
      if (existing) {
        if (existing.resultPromise) {
          return existing.resultPromise;
        }
        if (existing.result) {
          return existing.result;
        }
      }
    }

    const execute = async (): Promise<OperationalException> => {
      const repo = createOperationalExceptionRepository(ctx.supabase, ctx.tenantId);
      const exception = await repo.create({
        type: command.type,
        severity: command.severity,
        sourceDomain: command.sourceDomain,
        sourceEntityType: command.sourceEntityType,
        sourceEntityId: command.sourceEntityId,
        orderId: command.orderId,
        customerId: command.customerId,
        companyId: command.companyId,
        userId: ctx.userId,
      });

      try {
        await AuditService.write(ctx, {
          entityType: "operational_exception",
          entityId: exception.id,
          action: "create",
          newData: exception as unknown as Record<string, unknown>,
        });
      } catch (e) {
        // AUD-001: Documented non-blocking P2 audit debt
        console.warn("[AUD-001] Audit write failed after exception creation:", e);
      }

      return exception;
    };

    if (!idempotencyKey) {
      return execute();
    }

    const promise = execute();
    const entry: IdempotencyEntry = {
      timestamp: Date.now(),
      resultPromise: promise,
    };
    idempotencyStore.set(idempotencyKey, entry);

    try {
      const res = await promise;
      entry.result = res;
      delete entry.resultPromise;
      return res;
    } catch (err) {
      idempotencyStore.delete(idempotencyKey);
      throw err;
    }
  },

  async acknowledge(
    ctx: ServiceContext,
    exceptionId: string,
    expectedVersion: number,
  ): Promise<OperationalException> {
    if (!hasStaffAccess(ctx.roles)) {
      requireCapability(ctx.roles, "orders.manage");
    }

    const repo = createOperationalExceptionRepository(ctx.supabase, ctx.tenantId);
    const current = await repo.getById(exceptionId);
    if (!current) {
      throw new DomainError("NOT_FOUND", `Operational exception not found: ${exceptionId}`);
    }

    if (!canTransitionExceptionStatus(current.status, "ACKNOWLEDGED")) {
      throw new DomainError(
        "INVALID_STATE",
        `Cannot transition exception status from ${current.status} to ACKNOWLEDGED`,
      );
    }

    const now = new Date().toISOString();
    const updated = await repo.updateWithVersion(
      exceptionId,
      expectedVersion,
      {
        status: "ACKNOWLEDGED",
        owner_user_id: ctx.userId,
        acknowledged_at: now,
      } as Partial<OperationalExceptionRow>,
      ctx.userId,
    );

    if (!updated) {
      throw new DomainError(
        "INVALID_STATE",
        `Exception ${exceptionId} was modified by another operator (expected v${expectedVersion})`,
        { reason: "CONCURRENCY_CONFLICT" },
      );
    }

    try {
      await AuditService.write(ctx, {
        entityType: "operational_exception",
        entityId: updated.id,
        action: "status_change",
        oldData: { status: current.status, version: current.version } as Record<string, unknown>,
        newData: {
          status: updated.status,
          version: updated.version,
          ownerUserId: ctx.userId,
        } as Record<string, unknown>,
      });
    } catch (e) {
      console.warn("[AUD-001] Audit write failed after exception acknowledge:", e);
    }

    return updated;
  },

  async resolve(
    ctx: ServiceContext,
    command: ResolveOperationalExceptionCommand,
  ): Promise<OperationalException> {
    if (!hasStaffAccess(ctx.roles)) {
      requireCapability(ctx.roles, "orders.manage");
    }

    if (!command.resolutionNotes?.trim()) {
      throw new DomainError(
        "INVALID_STATE",
        "Resolution notes are required to resolve an exception",
      );
    }

    const repo = createOperationalExceptionRepository(ctx.supabase, ctx.tenantId);
    const current = await repo.getById(command.id);
    if (!current) {
      throw new DomainError("NOT_FOUND", `Operational exception not found: ${command.id}`);
    }

    if (!canTransitionExceptionStatus(current.status, "RESOLVED")) {
      throw new DomainError(
        "INVALID_STATE",
        `Cannot transition exception status from ${current.status} to RESOLVED`,
      );
    }

    // Domain Boundary Invariant Execution:
    // If resolution is REDELIVER, produce linked reattempt dispatch payload without mutating original order row
    const resolutionPayload: Record<string, unknown> = {
      ...command.resolutionPayload,
      executedAt: new Date().toISOString(),
      executorUserId: ctx.userId,
    };

    if (command.resolutionType === "REDELIVER" && current.orderId) {
      resolutionPayload.reattemptDispatchId = `dsp-reattempt-${current.orderId}-${Date.now().toString(36)}`;
    }

    const now = new Date().toISOString();
    const updated = await repo.updateWithVersion(
      command.id,
      command.expectedVersion,
      {
        status: "RESOLVED",
        resolution_type: command.resolutionType,
        resolution_payload: resolutionPayload,
        resolution_notes: command.resolutionNotes.trim(),
        resolved_at: now,
      } as Partial<OperationalExceptionRow>,
      ctx.userId,
    );

    if (!updated) {
      throw new DomainError(
        "INVALID_STATE",
        `Exception ${command.id} was modified by another operator (expected v${command.expectedVersion})`,
        { reason: "CONCURRENCY_CONFLICT" },
      );
    }

    try {
      await AuditService.write(ctx, {
        entityType: "operational_exception",
        entityId: updated.id,
        action: "status_change",
        oldData: { status: current.status, version: current.version } as Record<string, unknown>,
        newData: {
          status: updated.status,
          version: updated.version,
          resolutionType: updated.resolutionType,
          resolutionPayload: updated.resolutionPayload,
        } as Record<string, unknown>,
      });
    } catch (e) {
      console.warn("[AUD-001] Audit write failed after exception resolution:", e);
    }

    return updated;
  },

  async close(
    ctx: ServiceContext,
    exceptionId: string,
    expectedVersion: number,
  ): Promise<OperationalException> {
    if (!hasStaffAccess(ctx.roles)) {
      requireCapability(ctx.roles, "orders.manage");
    }

    const repo = createOperationalExceptionRepository(ctx.supabase, ctx.tenantId);
    const current = await repo.getById(exceptionId);
    if (!current) {
      throw new DomainError("NOT_FOUND", `Operational exception not found: ${exceptionId}`);
    }

    if (!canTransitionExceptionStatus(current.status, "CLOSED")) {
      throw new DomainError(
        "INVALID_STATE",
        `Cannot close exception from status ${current.status}. Must be RESOLVED first.`,
      );
    }

    const now = new Date().toISOString();
    const updated = await repo.updateWithVersion(
      exceptionId,
      expectedVersion,
      {
        status: "CLOSED",
        closed_at: now,
      } as Partial<OperationalExceptionRow>,
      ctx.userId,
    );

    if (!updated) {
      throw new DomainError(
        "INVALID_STATE",
        `Exception ${exceptionId} was modified by another operator (expected v${expectedVersion})`,
        { reason: "CONCURRENCY_CONFLICT" },
      );
    }

    try {
      await AuditService.write(ctx, {
        entityType: "operational_exception",
        entityId: updated.id,
        action: "status_change",
        newData: { status: "CLOSED", version: updated.version } as Record<string, unknown>,
      });
    } catch (e) {
      console.warn("[AUD-001] Audit write failed after exception close:", e);
    }

    return updated;
  },

  async dismiss(
    ctx: ServiceContext,
    exceptionId: string,
    expectedVersion: number,
    reason: string,
  ): Promise<OperationalException> {
    if (!hasStaffAccess(ctx.roles)) {
      requireCapability(ctx.roles, "orders.manage");
    }

    if (!reason?.trim()) {
      throw new DomainError("INVALID_STATE", "Dismissal reason is required");
    }

    const repo = createOperationalExceptionRepository(ctx.supabase, ctx.tenantId);
    const current = await repo.getById(exceptionId);
    if (!current) {
      throw new DomainError("NOT_FOUND", `Operational exception not found: ${exceptionId}`);
    }

    if (!canTransitionExceptionStatus(current.status, "DISMISSED")) {
      throw new DomainError(
        "INVALID_STATE",
        `Cannot dismiss exception from status ${current.status}`,
      );
    }

    const now = new Date().toISOString();
    const updated = await repo.updateWithVersion(
      exceptionId,
      expectedVersion,
      {
        status: "DISMISSED",
        resolution_notes: `Dismissed: ${reason.trim()}`,
        closed_at: now,
      } as Partial<OperationalExceptionRow>,
      ctx.userId,
    );

    if (!updated) {
      throw new DomainError(
        "INVALID_STATE",
        `Exception ${exceptionId} was modified by another operator (expected v${expectedVersion})`,
        { reason: "CONCURRENCY_CONFLICT" },
      );
    }

    return updated;
  },

  async getException(
    ctx: ServiceContext,
    exceptionId: string,
  ): Promise<OperationalException | null> {
    const repo = createOperationalExceptionRepository(ctx.supabase, ctx.tenantId);
    return repo.getById(exceptionId);
  },

  async listExceptionsForOrder(
    ctx: ServiceContext,
    orderId: string,
  ): Promise<OperationalException[]> {
    const repo = createOperationalExceptionRepository(ctx.supabase, ctx.tenantId);
    return repo.listByOrder(orderId);
  },

  async listExceptionsForCustomer(
    ctx: ServiceContext,
    customerId: string,
  ): Promise<OperationalException[]> {
    const repo = createOperationalExceptionRepository(ctx.supabase, ctx.tenantId);
    return repo.listByCustomer(customerId);
  },
};
