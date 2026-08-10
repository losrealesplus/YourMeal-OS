/**
 * Phase 2.1 / 2.2 — tenant_join_code application contract.
 *
 * Resolution and association are server-authoritative via RPC.
 * Client-supplied tenant_id is never used as resolution input.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { DomainError } from "@/domain/errors";
import {
  isValidTenantJoinCodeFormat,
  normalizeTenantJoinCode,
  parseResolvedTenantJoinPayload,
  type ResolvedTenantJoin,
} from "../domain/tenant-join-code";
import {
  parseTenantAssociationPayload,
  type TenantAssociationResult,
} from "../domain/tenant-association";

type RpcClient = Pick<SupabaseClient, "rpc">;

export const TenantJoinCodeService = {
  /**
   * Resolve a join code to the minimum tenant identity.
   * Does not create membership.
   */
  async resolve(
    supabase: RpcClient,
    code: string,
  ): Promise<ResolvedTenantJoin> {
    if (!isValidTenantJoinCodeFormat(code)) {
      throw new DomainError("INVALID_STATE", "Invalid join code format");
    }
    const normalized = normalizeTenantJoinCode(code);
    const { data, error } = await supabase.rpc("resolve_tenant_join_code", {
      p_code: normalized,
    });
    if (error) {
      throw new DomainError(
        "INVALID_STATE",
        error.message || "Join code resolution failed",
      );
    }
    try {
      return parseResolvedTenantJoinPayload(data);
    } catch {
      throw new DomainError("INVALID_STATE", "Join code resolution failed");
    }
  },

  /**
   * Phase 2.2 — associate authenticated user with EXISTING tenant via join code.
   * Creates pending membership only (P2-DEC-002 / ADR 0018). Never creates a Tenant.
   */
  async requestAssociation(
    supabase: RpcClient,
    code: string,
  ): Promise<TenantAssociationResult> {
    if (!isValidTenantJoinCodeFormat(code)) {
      throw new DomainError("INVALID_STATE", "Invalid join code format");
    }
    const normalized = normalizeTenantJoinCode(code);
    const { data, error } = await supabase.rpc(
      "request_tenant_association_by_join_code",
      { p_code: normalized },
    );
    if (error) {
      throw new DomainError(
        "INVALID_STATE",
        error.message || "Tenant association failed",
      );
    }
    try {
      return parseTenantAssociationPayload(data);
    } catch {
      throw new DomainError("INVALID_STATE", "Tenant association failed");
    }
  },

  /**
   * Generate / rotate join code for a tenant (staff / saas via RPC authz).
   */
  async generate(
    supabase: RpcClient,
    tenantId: string,
  ): Promise<string> {
    if (!tenantId) {
      throw new DomainError("INVALID_STATE", "Tenant id is required");
    }
    const { data, error } = await supabase.rpc("generate_tenant_join_code", {
      p_tenant_id: tenantId,
    });
    if (error) {
      throw new DomainError(
        "PERMISSION_DENIED",
        error.message || "Join code generation failed",
      );
    }
    if (typeof data !== "string" || !isValidTenantJoinCodeFormat(data)) {
      throw new DomainError("INVALID_STATE", "Join code generation failed");
    }
    return normalizeTenantJoinCode(data);
  },
};
