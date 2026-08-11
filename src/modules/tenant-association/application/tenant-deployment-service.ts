/**
 * Phase 2.3 — request pending membership via trusted deployment registry.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { DomainError } from "@/domain/errors";
import {
  parseTenantAssociationPayload,
  type TenantAssociationResult,
} from "../domain/tenant-association";
import type { DeploymentClaim } from "./deployment-identity";

type RpcClient = Pick<SupabaseClient, "rpc">;

export const TenantDeploymentService = {
  async requestAssociation(
    supabase: RpcClient,
    claim: DeploymentClaim,
  ): Promise<TenantAssociationResult> {
    const { data, error } = await supabase.rpc(
      "request_tenant_association_for_deployment",
      {
        p_platform: claim.platform,
        p_identifier: claim.identifier,
      },
    );
    if (error) {
      throw new DomainError(
        "INVALID_STATE",
        error.message || "Deployment association failed",
      );
    }
    try {
      return parseTenantAssociationPayload(data);
    } catch {
      throw new DomainError("INVALID_STATE", "Deployment association failed");
    }
  },
};
