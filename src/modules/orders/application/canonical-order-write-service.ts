import { requireCapability } from "@/permissions";
import type { ServiceContext } from "@/services/types";
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
    return createCanonicalOrderWriteRepository(ctx.supabase, ctx.tenantId).write(
      parsed.requestId,
      parsed.command,
    );
  },
  async modify(ctx: ServiceContext, input: CanonicalModifyInput) {
    requireCapability(ctx.roles, "orders.write");
    const parsed = parseCanonicalOrderEnvelope("modify", input);
    return createCanonicalOrderWriteRepository(ctx.supabase, ctx.tenantId).write(
      parsed.requestId,
      parsed.command,
    );
  },
};
