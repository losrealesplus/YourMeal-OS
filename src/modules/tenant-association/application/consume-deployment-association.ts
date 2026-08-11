/**
 * Phase 2.3 — post-auth handoff: authenticated session + deployment claim → pending.
 *
 * Call only when a JWT session exists. Never invent tenant_id on the client.
 * Idempotent server-side; safe to invoke from callback, cold /auth, and sign-in.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveDeploymentClaim } from "./deployment-identity";
import { TenantDeploymentService } from "./tenant-deployment-service";
import type { TenantAssociationResult } from "../domain/tenant-association";

export type ConsumeDeploymentAssociationResult =
  | { ok: true; association: TenantAssociationResult }
  | { ok: false; reason: string };

export async function tryConsumeDeploymentAssociation(
  supabase: Pick<SupabaseClient, "rpc">,
): Promise<ConsumeDeploymentAssociationResult> {
  try {
    const claim = await resolveDeploymentClaim();
    const association = await TenantDeploymentService.requestAssociation(
      supabase,
      claim,
    );
    return { ok: true, association };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}
