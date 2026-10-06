import { z } from "zod";
import { DomainError } from "@/domain/errors";
import type { AppSupabase } from "@/services/types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { verifiedOrderActorContext, type VerifiedOfferActor } from "../server/offer-write.server";

export const remediationOfferItemSchema = z
  .object({
    slotId: z.string().uuid(),
    menuId: z.string().uuid(),
    dishId: z.string().uuid(),
    dayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    expectedOldPrice: z
      .string()
      .regex(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,4})?$/)
      .nullable(),
    newPrice: z.string().regex(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,4})?$/),
  })
  .strict();

export type RemediationOfferItem = z.infer<typeof remediationOfferItemSchema>;

export const publishedOfferPriceRemediationManifestSchema = z
  .object({
    manifestVersion: z.literal("v1"),
    tenantId: z.string().uuid(),
    weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reason: z.string().min(5),
    items: z.array(remediationOfferItemSchema).min(1),
  })
  .strict();

export type PublishedOfferPriceRemediationManifest = z.infer<
  typeof publishedOfferPriceRemediationManifestSchema
>;

export const publishedOfferPriceRemediationRequestSchema = z
  .object({
    tenantId: z.string().uuid(),
    requestId: z.string().uuid(),
    manifest: publishedOfferPriceRemediationManifestSchema,
  })
  .strict();

export type PublishedOfferPriceRemediationRequest = z.infer<
  typeof publishedOfferPriceRemediationRequestSchema
>;

export async function computeRemediationManifestHash(
  manifest: PublishedOfferPriceRemediationManifest,
): Promise<string> {
  const sortedItems = [...manifest.items].sort((a, b) => a.slotId.localeCompare(b.slotId));
  const normalized = {
    manifestVersion: manifest.manifestVersion,
    tenantId: manifest.tenantId,
    weekStart: manifest.weekStart,
    reason: manifest.reason,
    items: sortedItems.map((item) => ({
      slotId: item.slotId,
      menuId: item.menuId,
      dishId: item.dishId,
      dayDate: item.dayDate,
      expectedOldPrice: item.expectedOldPrice,
      newPrice: item.newPrice,
    })),
  };
  const payload = JSON.stringify(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, "0")).join("");
}

export class RemediationRpcError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "RemediationRpcError";
  }
}

export async function runPublishedOfferPriceRemediation(
  actor: VerifiedOfferActor,
  requestInput: unknown,
  admin: { rpc: unknown } = supabaseAdmin,
) {
  const parseResult = publishedOfferPriceRemediationRequestSchema.safeParse(requestInput);
  if (!parseResult.success) {
    throw new DomainError("INVALID_STATE", "Invalid published offer price remediation payload");
  }
  const request = parseResult.data;
  if (request.tenantId !== request.manifest.tenantId) {
    throw new DomainError("TENANT_MISMATCH", "Tenant ID must match manifest tenant");
  }

  const { roles } = await verifiedOrderActorContext(actor, request.tenantId);
  const isPrivileged = roles.some((role) =>
    ["saas_admin", "company_admin", "operations_manager"].includes(role),
  );
  if (!isPrivileged) {
    throw new DomainError("PERMISSION_DENIED", "Privileged operator capability required");
  }

  const manifestHash = await computeRemediationManifestHash(request.manifest);

  type RpcCall = (
    name: string,
    params: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;

  let response;
  try {
    response = await (admin.rpc as RpcCall)("cr_menu_published_offer_price_remediation", {
      _tenant_id: request.tenantId,
      _actor_id: actor.userId,
      _request_id: request.requestId,
      _manifest: {
        ...request.manifest,
        manifestHash,
      },
    });
  } catch {
    throw new RemediationRpcError("REMEDIATION_UNAVAILABLE");
  }

  if (response.error) {
    throw new RemediationRpcError(response.error.message);
  }

  return response.data as {
    success: boolean;
    remediatedCount: number;
    manifestHash: string;
  };
}
