import { offerPriceUnits } from "../domain/offer-quote";
import { z } from "zod";
import { parseCanonicalOrderWriteResult } from "@/modules/orders/infrastructure/canonical-order-write-repository";
import bundledCommercial from "@/tenant/resources/commercial.json";
import { hasRegisteredTenantOffers } from "@/modules/commercial/application/commercial-offer-registry";
import type { AppSupabase } from "@/services/types";
import type { AppRole } from "@/hooks/use-auth";
import { can } from "@/permissions";
import { DomainError } from "@/domain/errors";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getTenantOffers, registerTenantOffers } from "@/modules/commercial";
import { resolveServerInstanceRuntimeConfig } from "@/lib/instance-runtime-boundary";
import "@/tenant/commercial-config";
import {
  EATCLEAN_PARTIAL_LAUNCH_CONFIG,
  EATCLEAN_TENANT_ID,
  isEatCleanContext,
  isEatCleanStaffOrderCaptureFrozen,
} from "@/config/eatclean-partial-launch";
import type { Json } from "@/integrations/supabase/types";
import type { OfferWriteRequest } from "../application/offer-write-input";

export type VerifiedOfferActor = { supabase: AppSupabase; userId: string };
type OfferRpcName =
  "cr_order_offer_quote_issue" | "cr_order_offer_quote_commit" | "cr_order_custom_commit";
type RpcCall = (
  name: OfferRpcName,
  parameters: Record<string, Json>,
) => Promise<{ data: Json | null; error: { message: string } | null }>;

/** Verified DB identity and server instance binding, strictly rejecting cross-instance requests. */
export async function verifiedOrderActorContext(
  actor: VerifiedOfferActor,
  tenantId: string,
  customEnv?: Record<string, string | undefined>,
) {
  const serverConfig = resolveServerInstanceRuntimeConfig(customEnv);

  const tenant = await actor.supabase
    .from("tenants")
    .select("id,slug")
    .eq("id", tenantId)
    .maybeSingle();

  if (tenant.error || !tenant.data)
    throw new DomainError("TENANT_MISMATCH", "Tenant does not match this configured server");

  const isTenantBound =
    tenant.data.slug === serverConfig.tenantSlug ||
    (serverConfig.tenantSlug === "eatclean-staging" && tenant.data.slug === "eatclean");
  if (!isTenantBound)
    throw new DomainError("TENANT_MISMATCH", "Tenant does not match this configured server");

  const membership = await actor.supabase
    .from("tenant_members")
    .select("status")
    .eq("tenant_id", tenantId)
    .eq("user_id", actor.userId)
    .eq("status", "approved")
    .is("deleted_at", null)
    .maybeSingle();
  const roles = await actor.supabase
    .from("user_roles")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", actor.userId);
  const saas = await actor.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", actor.userId)
    .eq("role", "saas_admin")
    .is("tenant_id", null)
    .maybeSingle();
  if (membership.error || roles.error || saas.error || (!membership.data && !saas.data))
    throw new DomainError("PERMISSION_DENIED", "Active tenant membership required");
  const verifiedRoles: AppRole[] = (roles.data ?? []).map((row) => row.role);
  if (saas.data) verifiedRoles.push("saas_admin");
  if (!can(verifiedRoles, "orders.write"))
    throw new DomainError("PERMISSION_DENIED", "Order write capability required");
  return { tenant: tenant.data, roles: verifiedRoles };
}

/**
 * Authoritative server-side gate for order capture & creation.
 * Enforces release flags (staffOrderCapture, orderCreation) strictly on the server
 * before any privileged database writes, commercial quote issuance, or commits.
 * Never trusts client headers, client-supplied flags, or unverified runtime environments.
 */
export function assertServerOrderWriteAllowed(
  tenant: { id: string; slug: string },
  operation: "capture" | "modify",
  customCommit = false,
  customEnv?: Record<string, string | undefined>,
): void {
  const isEatClean =
    tenant.slug === "eatclean" ||
    tenant.slug === "eatclean-staging" ||
    tenant.id === EATCLEAN_TENANT_ID ||
    isEatCleanContext({ tenantId: tenant.id, tenantSlug: tenant.slug });

  if (!isEatClean) {
    return;
  }

  // EatClean never enables custom order commits
  if (customCommit) {
    throw new OfferWriteRpcError("CUSTOM_NOT_ENABLED");
  }

  // New order capture / creation is strictly frozen unless running in a verified local synthetic lab
  if (operation === "capture") {
    if (
      isEatCleanStaffOrderCaptureFrozen(
        { tenantId: tenant.id, tenantSlug: tenant.slug },
        customEnv,
      )
    ) {
      throw new DomainError("INVALID_STATE", EATCLEAN_PARTIAL_LAUNCH_CONFIG.frozenMessage);
    }
  }
}

export async function offerCommercialContext(
  actor: VerifiedOfferActor,
  tenantId: string,
  customEnv?: Record<string, string | undefined>,
) {
  const { tenant } = await verifiedOrderActorContext(actor, tenantId, customEnv);
  const serverConfig = resolveServerInstanceRuntimeConfig(customEnv);
  if (!Array.isArray(bundledCommercial))
    throw new OfferWriteRpcError("COMMERCIAL_CONTEXT_UNAVAILABLE");

  // Commercial configuration is strictly registered within the authorized instance context.
  // The Core Demo server is never contaminated with EatClean instance configuration.
  const isEatClean =
    (serverConfig.tenantSlug === "eatclean" || serverConfig.tenantSlug === "eatclean-staging") &&
    (tenant.slug === "eatclean" || tenant.slug === "eatclean-staging");

  if (isEatClean && !hasRegisteredTenantOffers(tenant.slug)) {
    const { registerEatCleanCommercialOffers, EATCLEAN_COMMERCIAL_OFFERS } = await import(
      "../../../../instances/yourmeal-eatclean/config/commercial.config"
    );
    registerEatCleanCommercialOffers();
    if (tenant.slug !== "eatclean") {
      registerTenantOffers(tenant.slug, EATCLEAN_COMMERCIAL_OFFERS);
    }
  }

  const offers = getTenantOffers(tenant.slug);
  if (!hasRegisteredTenantOffers(tenant.slug))
    throw new OfferWriteRpcError("COMMERCIAL_CONTEXT_UNAVAILABLE");
  if (
    !Array.isArray(offers) ||
    offers.some(
      (offer) =>
        !offer ||
        typeof offer.code !== "string" ||
        !offer.code ||
        !Number.isSafeInteger(offer.basePrice?.cents) ||
        offer.basePrice.cents < 0 ||
        !Array.isArray(offer.promotions),
    )
  )
    throw new OfferWriteRpcError("COMMERCIAL_CONTEXT_UNAVAILABLE");

  // Determine commercial mode server-side:
  // Individual menu / independent à-la-carte requires an explicit registered
  // individual_menu offer with pricingModel = per_unit and no promotions.
  // Never automatically authorize from an empty offers list.
  const hasIndividualOffer = offers.some(
    (offer) =>
      offer.code === "individual_menu" &&
      offer.pricingModel === "per_unit" &&
      (!offer.promotions || offer.promotions.length === 0),
  );

  const mode = hasIndividualOffer ? "individual_line_pricing_v1" : "weekly_plan";

  const policy = JSON.stringify({ tenantId, tenantSlug: tenant.slug, mode, offers });
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(policy));
  return {
    active: offers.length > 0,
    mode,
    policyHash: Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    ),
  };
}

const allowedCodes = [
  "CUSTOM_NOT_ENABLED",
  "REPEAT_CONFIRMATION_REQUIRED",
  "OFFER_NOT_FOUND",
  "OFFER_AMBIGUOUS",
  "OFFER_PRICING_COMMERCIAL_UNSUPPORTED",
  "OFFER_PRICING_OVERRIDE_UNSUPPORTED",
  "COMMERCIAL_QUOTE_REQUIRED",
  "PRICE_CHANGED",
  "PRICE_UNAVAILABLE",
  "EXPLICIT_ZERO_CONFIRMATION_REQUIRED",
  "QUOTE_INPUT_MISMATCH",
  "REQUEST_ID_CONFLICT",
  "IDEMPOTENCY_CONFLICT",
  "REVISION_CONFLICT",
  "STALE_REVISION",
  "ORDER_CLOSED",
  "B2B_DELIVERY_UNSUPPORTED",
  "PERMISSION_DENIED",
  "LINE_ID_INVALID",
  "PUBLISHED_OFFER_PRICE_MODIFICATION_BLOCKED",
  "REMEDIATION_MANIFEST_MISMATCH",
  "REMEDIATION_EXPECTED_PRICE_MISMATCH",
] as const;
/** Error messages expose a fixed code, never raw SQL/command/customer/secret payloads. */
export class OfferWriteRpcError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "OfferWriteRpcError";
  }
}

export async function runVerifiedOfferWrite(
  actor: VerifiedOfferActor,
  request: OfferWriteRequest,
  quoteId?: string,
  admin: { rpc: unknown } = supabaseAdmin,
  customCommit = false,
  customEnv?: Record<string, string | undefined>,
) {
  // Policy re-evaluation is mandatory at both quote and commit. RPC handles committed retry
  // before quote expiry/price-policy comparison, keeping the original immutable quote payload.
  const dishLines = request.command.lines.filter(
    (line): line is Extract<typeof line, { kind: "dish" }> => line.kind === "dish",
  );
  if (customCommit && (dishLines.length > 0 || quoteId))
    throw new OfferWriteRpcError("OFFER_WRITE_FAILED");
  if (!customCommit && dishLines.length === 0)
    throw new OfferWriteRpcError("CUSTOM_COMMIT_REQUIRED");

  // 1. Authoritative verification of actor identity, membership, capabilities, and server instance binding
  const { tenant, roles } = await verifiedOrderActorContext(actor, request.tenantId, customEnv);

  // 2. Centralized authoritative server barrier for EatClean order capture & custom write
  // Runs BEFORE any commercial context evaluation, quote generation, or privileged RPC
  assertServerOrderWriteAllowed(tenant, request.command.operation, customCommit, customEnv);

  let context;
  try {
    if (request.command.lines.some((line) => line.kind === "custom")) {
      if (
        !roles.some((role) =>
          ["company_admin", "operations_manager", "saas_admin"].includes(role),
        )
      )
        throw new DomainError("PERMISSION_DENIED", "Staff capability required for custom writes");
    }
    if (request.command.lines.some((line) => line.kind === "dish" && (line as any).isOffMenu)) {
      if (
        !roles.some((role) =>
          ["company_admin", "operations_manager", "saas_admin"].includes(role),
        )
      )
        throw new DomainError("PERMISSION_DENIED", "Staff capability required for off-menu exceptions");
    }
    if (!customCommit) context = await offerCommercialContext(actor, request.tenantId, customEnv);
  } catch (error) {
    if (error instanceof DomainError || error instanceof OfferWriteRpcError) throw error;
    throw new OfferWriteRpcError("OFFER_WRITE_UNAVAILABLE");
  }
  const parameters: Record<string, Json> = {
    _tenant_id: request.tenantId,
    _actor_id: actor.userId,
    _request_id: request.requestId,
    _command: request.command as unknown as Json,
    ...(context ? { _commercial_context: context } : {}),
  };
  if (quoteId) parameters._quote_id = quoteId;
  let response;
  try {
    response = await (admin.rpc as RpcCall)(
      customCommit
        ? "cr_order_custom_commit"
        : quoteId
          ? "cr_order_offer_quote_commit"
          : "cr_order_offer_quote_issue",
      parameters,
    );
  } catch {
    throw new OfferWriteRpcError("OFFER_WRITE_UNAVAILABLE");
  }
  const { data, error } = response;
  if (error) {
    throw new OfferWriteRpcError(
      allowedCodes.find((code) => error.message === code || error.message.startsWith(`${code}:`)) ??
        "OFFER_WRITE_FAILED",
    );
  }
  if (data === null) throw new OfferWriteRpcError("OFFER_WRITE_FAILED");
  if (quoteId || customCommit)
    return parseCanonicalOrderWriteResult(data, request.tenantId, request.command);
  const quote = z
    .object({
      quoteId: z.string().uuid(),
      expiresAt: z.string().datetime({ offset: true }),
      policyHash: z.string().regex(/^[0-9a-f]{64}$/),
      total: z.string().regex(/^\d{1,10}\.\d{2}$/),
      lines: z
        .array(
          z.object({
            slotId: z.string().uuid().nullable(),
            menuId: z.string().uuid(),
            dishId: z.string().uuid(),
            dayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            qty: z.number().int().positive().max(2147483647),
            basePrice: z.string().regex(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,4})?$/),
            slotPrice: z
              .string()
              .regex(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,4})?$/)
              .nullable(),
            unitPrice: z.string().regex(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,4})?$/),
            priceSource: z.enum([
              "slot",
              "catalogue",
              "captured_snapshot",
              "catalogue_off_menu",
              "catalogue_off_menu_override",
            ]),
            priceSnapshotStatus: z.enum(["captured", "explicit_zero"]),
            isOffMenu: z.boolean().optional(),
          }),
        )
        .min(1),
    })
    .safeParse(data);
  if (
    !quote.success ||
    quote.data.policyHash !== context?.policyHash ||
    quote.data.lines.length !== dishLines.length ||
    quote.data.lines.some(
      (line, index) =>
        line.dishId !== dishLines[index]?.dishId ||
        line.dayDate !== dishLines[index]?.dayDate ||
        line.qty !== dishLines[index]?.qty ||
        (dishLines[index]?.slotId !== undefined && line.slotId !== dishLines[index]?.slotId) ||
        (Boolean((dishLines[index] as any)?.isOffMenu) !== Boolean(line.isOffMenu)),
    )
  )
    throw new OfferWriteRpcError("OFFER_WRITE_FAILED");
  const financialUnits = quote.data.lines.reduce(
    (sum, line) => sum + offerPriceUnits(line.unitPrice) * BigInt(line.qty),
    0n,
  );
  const cents = (financialUnits + 50n) / 100n;
  const expectedTotal = `${cents / 100n}.${String(cents % 100n).padStart(2, "0")}`;
  if (
    quote.data.total !== expectedTotal ||
    quote.data.lines.some(
      (line) =>
        (offerPriceUnits(line.unitPrice) === 0n) !==
          (line.priceSnapshotStatus === "explicit_zero") ||
        (line.priceSource === "catalogue" &&
          (line.slotPrice !== null ||
            offerPriceUnits(line.unitPrice) !== offerPriceUnits(line.basePrice) ||
            offerPriceUnits(line.unitPrice) === 0n)) ||
        (line.priceSource === "catalogue_off_menu" &&
          (line.slotPrice !== null ||
            offerPriceUnits(line.unitPrice) !== offerPriceUnits(line.basePrice) ||
            offerPriceUnits(line.unitPrice) === 0n ||
            line.slotId !== null)) ||
        (line.priceSource === "catalogue_off_menu_override" &&
          (line.slotPrice !== null ||
            offerPriceUnits(line.unitPrice) === 0n ||
            line.slotId !== null)) ||
        (line.priceSource === "slot" &&
          (line.slotPrice === null ||
            offerPriceUnits(line.unitPrice) !== offerPriceUnits(line.slotPrice))),
    )
  )
    throw new OfferWriteRpcError("OFFER_WRITE_FAILED");
  const customLines = request.command.lines.filter((line) => line.kind === "custom");
  const customUnits = customLines.reduce(
    (sum, line) => sum + offerPriceUnits(line.unitPrice) * BigInt(line.qty),
    0n,
  );
  const formatCents = (units: bigint) => {
    const cents = (units + 50n) / 100n;
    return `${cents / 100n}.${String(cents % 100n).padStart(2, "0")}`;
  };
  return {
    ...quote.data,
    dishSubtotal: quote.data.total,
    customSubtotal: formatCents(customUnits),
    total: formatCents(financialUnits + customUnits),
    customLines,
  };
}

/**
 * Reconciles an uncertain in-flight order capture using the PostgreSQL canonical idempotency ledger.
 * Determines whether the request ID was already committed in the database or never published.
 */
export async function runVerifiedOfferReconciliation(
  actor: VerifiedOfferActor,
  tenantId: string,
  requestId: string,
  customEnv?: Record<string, string | undefined>,
) {
  await verifiedOrderActorContext(actor, tenantId, customEnv);

  // Check the PostgreSQL canonical idempotency ledger (order_write_requests)
  const { data: requestRow, error: requestError } = await ((supabaseAdmin as unknown as {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          eq: (col2: string, val2: string) => {
            maybeSingle: () => Promise<{
              data: { order_id: string; committed_revision: number; operation: string; created_at: string } | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    };
  })
    .from("order_write_requests")
    .select("order_id, committed_revision, operation, created_at")
    .eq("tenant_id", tenantId)
    .eq("request_id", requestId)
    .maybeSingle());

  if (requestError) {
    throw new DomainError("LEDGER_QUERY_FAILED", "Failed to query canonical order ledger");
  }

  if (!requestRow?.order_id) {
    // Ledger has no confirmed row for this requestId.
    // NEVER assume the operation died or unlock automatically based on timers:
    // a network delay or slow transaction could still be in-flight.
    // Lock must remain active on the client.
    return {
      reconciled: false,
      committed: false,
      requestId,
      order: null,
      reason: "LEDGER_RECORD_NOT_FOUND",
    };
  }

  // Fetch the committed order details from public.orders using column 'total' (NOT 'total_amount')
  const { data: orderRow, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, status, total, created_at")
    .eq("tenant_id", tenantId)
    .eq("id", requestRow.order_id)
    .maybeSingle();

  if (orderError || !orderRow) {
    // Ledger entry is confirmed, but reading public.orders failed.
    // NEVER synthesize draft or total=0 as verified data.
    // Preserve the lock and report the reconciliation failure.
    throw new DomainError(
      "RECONCILIATION_ORDER_FETCH_FAILED",
      "Order ledger record confirmed, but order row could not be read. Lock preserved.",
    );
  }

  return {
    reconciled: true,
    committed: true,
    requestId,
    order: {
      id: orderRow.id,
      status: orderRow.status,
      total: Number(orderRow.total),
      createdAt: orderRow.created_at,
    },
  };
}

