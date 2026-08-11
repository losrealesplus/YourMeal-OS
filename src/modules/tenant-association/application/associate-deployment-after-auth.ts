/**
 * Shared post-auth association toast + logging for Phase 2.3 deployment binding.
 */

import { logPostLoginStep } from "@/auth";
import type { ConsumeDeploymentAssociationResult } from "./consume-deployment-association";
import { tryConsumeDeploymentAssociation } from "./consume-deployment-association";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function associateDeploymentAfterAuth(
  supabase: Pick<SupabaseClient, "rpc">,
  opts: {
    userId: string;
    source: string;
    onPending?: () => void;
    onError?: (reason: string) => void;
  },
): Promise<ConsumeDeploymentAssociationResult> {
  const result = await tryConsumeDeploymentAssociation(supabase);
  if (result.ok) {
    logPostLoginStep("TENANT_ASSOCIATION", {
      userId: opts.userId,
      status: result.association.status,
      created: result.association.created,
      source: opts.source,
    });
    if (result.association.status === "pending") {
      opts.onPending?.();
    }
  } else {
    logPostLoginStep("TENANT_ASSOCIATION", {
      userId: opts.userId,
      ok: false,
      reason: result.reason,
      source: opts.source,
    });
    opts.onError?.(result.reason);
  }
  return result;
}
