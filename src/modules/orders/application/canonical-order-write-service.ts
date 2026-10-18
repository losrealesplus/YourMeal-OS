import { requireCapability, hasStaffAccess } from "@/permissions";
import { DomainError } from "@/domain/errors";
import type { ServiceContext } from "@/services/types";
import { isWeeklyOrderCutoffPassed } from "@/modules/weekly-menu/application/week-dates";
import {
  parseCanonicalOrderEnvelope,
  type CanonicalCaptureInput,
  type CanonicalModifyInput,
} from "../domain/canonical-order-write";
import { createCanonicalOrderWriteRepository } from "../infrastructure/canonical-order-write-repository";

/** One authenticated RPC; no application-side compensations, totals or separate audit writes. */
export const CanonicalOrderWriteService = {
  async capture(ctx: ServiceContext, input: CanonicalCaptureInput) {
    requireCapability(ctx.roles, "orders.write");
    const parsed = parseCanonicalOrderEnvelope("capture", input);

    if (!hasStaffAccess(ctx.roles) && ctx.tenantSlug) {
      if (isWeeklyOrderCutoffPassed(parsed.command.weekStart, { tenantSlug: ctx.tenantSlug })) {
        throw new DomainError(
          "WEEKLY_ORDER_CUTOFF_PASSED",
          `El plazo para realizar pedidos de la semana ${parsed.command.weekStart} ha finalizado.`,
          { weekStart: parsed.command.weekStart, tenantSlug: ctx.tenantSlug },
        );
      }
    }

    return createCanonicalOrderWriteRepository(ctx.supabase, ctx.tenantId).write(
      parsed.requestId,
      parsed.command,
    );
  },
  async modify(ctx: ServiceContext, input: CanonicalModifyInput) {
    requireCapability(ctx.roles, "orders.write");
    const parsed = parseCanonicalOrderEnvelope("modify", input);

    if (!hasStaffAccess(ctx.roles) && ctx.tenantSlug) {
      if (isWeeklyOrderCutoffPassed(parsed.command.weekStart, { tenantSlug: ctx.tenantSlug })) {
        throw new DomainError(
          "WEEKLY_ORDER_CUTOFF_PASSED",
          `El plazo para modificar pedidos de la semana ${parsed.command.weekStart} ha finalizado.`,
          { weekStart: parsed.command.weekStart, tenantSlug: ctx.tenantSlug },
        );
      }
    }

    return createCanonicalOrderWriteRepository(ctx.supabase, ctx.tenantId).write(
      parsed.requestId,
      parsed.command,
    );
  },
};
