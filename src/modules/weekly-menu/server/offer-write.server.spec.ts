import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearTenantOffersRegistry, registerTenantOffers } from "@/modules/commercial";
import type { CommercialOffer } from "@/modules/commercial";
import type { AppSupabase } from "@/services/types";
import {
  offerCommercialContext,
  runVerifiedOfferWrite,
  runVerifiedOfferReconciliation,
} from "./offer-write.server";
import { parseOfferWriteRequest } from "../application/offer-write-input";
import { EATCLEAN_TENANT_ID } from "@/config/eatclean-partial-launch";
import { LOCAL_STAGING_URL, LOCAL_STAGING_PUBLIC_KEY } from "@/lib/local-staging-runtime";
vi.mock("@/tenant/commercial-config", () => ({}));
vi.mock("@/tenant/resources/brand.json", () => ({ default: { slug: "test-tenant" } }));
const mockAdminFrom = vi.fn();
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    rpc: vi.fn(),
    from: (...args: unknown[]) => mockAdminFrom(...args),
  },
}));
const tenantId = "10000000-0000-4000-8000-000000000001",
  userId = "20000000-0000-4000-8000-000000000001",
  quoteId = "60000000-0000-4000-8000-000000000001";
const request = parseOfferWriteRequest({
  tenantId,
  requestId: "70000000-0000-4000-8000-000000000001",
  command: {
    operation: "capture",
    weekStart: "2026-10-05",
    customer: { kind: "existing", id: "30000000-0000-4000-8000-000000000001" },
    lines: [
      {
        kind: "dish",
        dishId: "40000000-0000-4000-8000-000000000001",
        dayDate: "2026-10-05",
        qty: 1,
      },
    ],
  },
});
function actor(
  options: { slug?: string; membership?: boolean; role?: string; throwNetwork?: boolean } = {},
) {
  return {
    userId,
    supabase: {
      from(table: string) {
        if (options.throwNetwork) throw new Error("SECRET provider details");
        const query = {
          select: () => query,
          eq: () => query,
          is: () => query,
          maybeSingle: async () => ({
            data:
              table === "tenants"
                ? { id: tenantId, slug: options.slug ?? "test-tenant" }
                : table === "tenant_members"
                  ? options.membership === false
                    ? null
                    : { status: "approved" }
                  : null,
            error: null,
          }),
          then: (resolve: (v: unknown) => unknown) =>
            Promise.resolve({
              data: [{ role: options.role ?? "operations_manager" }],
              error: null,
            }).then(resolve),
        };
        return query;
      },
    } as unknown as AppSupabase,
  };
}
beforeEach(() => {
  clearTenantOffersRegistry();
  registerTenantOffers("test-tenant", []);
});
it("explicit empty registry is a verified inactive policy", async () =>
  expect(await offerCommercialContext(actor(), tenantId)).toMatchObject({
    active: false,
    policyHash: expect.stringMatching(/^[0-9a-f]{64}$/),
  }));
it("missing initialization fails closed instead of inactive", async () => {
  clearTenantOffersRegistry();
  await expect(offerCommercialContext(actor(), tenantId)).rejects.toMatchObject({
    code: "COMMERCIAL_CONTEXT_UNAVAILABLE",
  });
});
it("malformed registered offers fail closed", async () => {
  registerTenantOffers("test-tenant", [{} as CommercialOffer]);
  await expect(offerCommercialContext(actor(), tenantId)).rejects.toMatchObject({
    code: "COMMERCIAL_CONTEXT_UNAVAILABLE",
  });
});
it("current server registry changes policy hash at commit", async () => {
  const before = await offerCommercialContext(actor(), tenantId);
  registerTenantOffers("test-tenant", [
    {
      id: "package",
      title: "Package",
      subtitle: "",
      description: "",
      unitLabel: "package",
      slotsIncluded: 5,
      code: "package",
      basePrice: { cents: 100, currency: "EUR", formatted: "1" },
      promotions: [],
    } as CommercialOffer,
  ]);
  const after = await offerCommercialContext(actor(), tenantId);
  expect(after.active).toBe(true);
  expect(after.mode).toBe("weekly_plan");
  expect(after.policyHash).not.toBe(before.policyHash);
});
it("identifies individual_line_pricing_v1 mode for single per_unit unpromoted offer", async () => {
  registerTenantOffers("test-tenant", [
    {
      id: "individual_menu",
      title: "Individual Menu",
      subtitle: "",
      description: "",
      unitLabel: "dish",
      slotsIncluded: 1,
      code: "individual_menu",
      pricingModel: "per_unit",
      basePrice: { cents: 1190, currency: "EUR", formatted: "11.90" },
      promotions: [],
    } as CommercialOffer,
  ]);
  const context = await offerCommercialContext(actor(), tenantId);
  expect(context.active).toBe(true);
  expect(context.mode).toBe("individual_line_pricing_v1");
});
it("server isolation: Demo server rejects EatClean requests", async () => {
  const eatcleanTenantId = "8bba00ba-331b-42c8-9283-4e3836ffb870";
  vi.stubEnv("TENANT_SLUG", "yourmeal-os");
  try {
    await expect(
      offerCommercialContext(actor({ slug: "eatclean" }), eatcleanTenantId),
    ).rejects.toMatchObject({
      code: "TENANT_MISMATCH",
    });
  } finally {
    vi.unstubAllEnvs();
  }
});
it("server isolation: EatClean server accepts EatClean and resolves individual_line_pricing_v1", async () => {
  const eatcleanTenantId = "8bba00ba-331b-42c8-9283-4e3836ffb870";
  vi.stubEnv("TENANT_SLUG", "eatclean");
  try {
    const context = await offerCommercialContext(
      actor({ slug: "eatclean" }),
      eatcleanTenantId,
    );
    expect(context.active).toBe(true);
    expect(context.mode).toBe("individual_line_pricing_v1");

    // Foreign tenant rejected on EatClean server
    await expect(
      offerCommercialContext(actor({ slug: "yourmeal-os" }), tenantId),
    ).rejects.toMatchObject({
      code: "TENANT_MISMATCH",
    });
  } finally {
    vi.unstubAllEnvs();
  }
});
it("never treats empty offers list as commercial authorization for individual_line_pricing_v1", async () => {
  const eatcleanTenantId = "8bba00ba-331b-42c8-9283-4e3836ffb870";
  vi.stubEnv("TENANT_SLUG", "eatclean");
  try {
    registerTenantOffers("eatclean", []);
    const context = await offerCommercialContext(
      actor({ slug: "eatclean" }),
      eatcleanTenantId,
    );
    expect(context.active).toBe(false);
    expect(context.mode).toBe("weekly_plan");
  } finally {
    vi.unstubAllEnvs();
  }
});
it("DB slug must match this server configuration", async () =>
  await expect(offerCommercialContext(actor({ slug: "other" }), tenantId)).rejects.toMatchObject({
    code: "TENANT_MISMATCH",
  }));
it.each([{ membership: false }, { role: "kitchen" }])(
  "requires verified active membership and capability %j",
  async (options) =>
    await expect(offerCommercialContext(actor(options), tenantId)).rejects.toMatchObject({
      code: "PERMISSION_DENIED",
    }),
);
it("RPC transport errors never expose provider details", async () =>
  await expect(
    runVerifiedOfferWrite(actor(), request, undefined, {
      rpc: async () => {
        throw new Error("SECRET provider details");
      },
    }),
  ).rejects.toMatchObject({ message: "OFFER_WRITE_UNAVAILABLE" }));
it("unrecognized messages containing a code do not become trusted typed errors", async () =>
  await expect(
    runVerifiedOfferWrite(actor(), request, undefined, {
      rpc: async () => ({
        data: null,
        error: { message: "SECRET contains PRICE_CHANGED and payload" },
      }),
    }),
  ).rejects.toMatchObject({ message: "OFFER_WRITE_FAILED" }));
it("exact fixed SQL error maps to safe typed code", async () =>
  await expect(
    runVerifiedOfferWrite(actor(), request, undefined, {
      rpc: async () => ({ data: null, error: { message: "PRICE_CHANGED" } }),
    }),
  ).rejects.toMatchObject({ message: "PRICE_CHANGED" }));
it("malformed quote response fails closed", async () =>
  await expect(
    runVerifiedOfferWrite(actor(), request, undefined, {
      rpc: async () => ({ data: { quoteId: "latest" }, error: null }),
    }),
  ).rejects.toMatchObject({ message: "OFFER_WRITE_FAILED" }));
it("commit reuses canonical tenant/result validation", async () =>
  await expect(
    runVerifiedOfferWrite(actor(), request, quoteId, {
      rpc: async () => ({ data: { order: { tenant_id: "other" } }, error: null }),
    }),
  ).rejects.toMatchObject({ code: "INVALID_STATE" }));
it("trusted actor is server identity and quote response is validated", async () => {
  const context = await offerCommercialContext(actor(), tenantId);
  const rpc = vi.fn(async () => ({
    data: {
      quoteId,
      expiresAt: "2026-10-06T10:00:00+00:00",
      policyHash: context.policyHash,
      total: "2.50",
      lines: [
        {
          slotId: quoteId,
          menuId: quoteId,
          dishId: request.command.lines.filter((line) => line.kind === "dish")[0]!.dishId,
          dayDate: "2026-10-05",
          qty: 1,
          basePrice: "11.9000",
          slotPrice: "2.5000",
          unitPrice: "2.5000",
          priceSource: "slot",
          priceSnapshotStatus: "captured",
        },
      ],
    },
    error: null,
  }));
  const result = await runVerifiedOfferWrite(actor(), request, undefined, { rpc });
  expect(result).toMatchObject({ quoteId });
  expect(rpc.mock.calls[0]).toEqual([
    "cr_order_offer_quote_issue",
    expect.objectContaining({ _actor_id: userId, _commercial_context: context }),
  ]);
});

it.each(["STALE_REVISION", "ORDER_CLOSED", "B2B_DELIVERY_UNSUPPORTED"])(
  "preserves actual canonical error %s without raw details",
  async (code) =>
    await expect(
      runVerifiedOfferWrite(actor(), request, quoteId, {
        rpc: async () => ({ data: null, error: { message: `${code}: sensitive payload` } }),
      }),
    ).rejects.toMatchObject({ message: code }),
);

it.each([
  { total: "3.00" },
  { unitPrice: "0", priceSnapshotStatus: "captured", slotPrice: "0" },
  { unitPrice: "2.5", priceSnapshotStatus: "explicit_zero" },
  { unitPrice: "100000000" },
  { qty: 2147483648 },
  { slotPrice: null, priceSource: "slot" },
  { basePrice: "NaN" },
])("issuer financial response consistency fails closed %j", async (change) => {
  const context = await offerCommercialContext(actor(), tenantId);
  const { total = "2.50", ...lineChange } = change;
  const data = {
    quoteId,
    expiresAt: "2026-10-06T10:00:00+00:00",
    policyHash: context.policyHash,
    total,
    lines: [
      {
        slotId: quoteId,
        menuId: quoteId,
        dishId: request.command.lines.filter((line) => line.kind === "dish")[0]!.dishId,
        dayDate: "2026-10-05",
        qty: 1,
        basePrice: "11.9000",
        slotPrice: "2.5000",
        unitPrice: "2.5000",
        priceSource: "slot",
        priceSnapshotStatus: "captured",
        ...lineChange,
      },
    ],
  };
  await expect(
    runVerifiedOfferWrite(actor(), request, undefined, {
      rpc: async () => ({ data, error: null }),
    }),
  ).rejects.toMatchObject({ message: "OFFER_WRITE_FAILED" });
});

const customRequest = () =>
  parseOfferWriteRequest({
    ...request,
    command: {
      ...request.command,
      lines: [{ kind: "custom", name: "Sopa", qty: 2, dayDate: "2026-10-05", unitPrice: "3.25" }],
    },
  });
it("custom-only uses exact staff RPC with no commercial registry, menu or quote", async () => {
  clearTenantOffersRegistry();
  const rpc = vi.fn(async () => ({ data: null, error: { message: "CUSTOM_NOT_ENABLED" } }));
  await expect(
    runVerifiedOfferWrite(actor(), customRequest(), undefined, { rpc }, true),
  ).rejects.toMatchObject({ message: "CUSTOM_NOT_ENABLED" });
  expect(rpc).toHaveBeenCalledWith(
    "cr_order_custom_commit",
    expect.objectContaining({ _actor_id: userId, _command: customRequest().command }),
  );
  expect(rpc).not.toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ _commercial_context: expect.anything() }),
  );
  expect(rpc).not.toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ _quote_id: expect.anything() }),
  );
});
it.each(["customer", "kitchen"])("rejects custom %s before privileged RPC", async (role) => {
  const rpc = vi.fn();
  await expect(
    runVerifiedOfferWrite(actor({ role }), customRequest(), undefined, { rpc }, true),
  ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
  expect(rpc).not.toHaveBeenCalled();
});
it("rejects purecustom via quote and dish via custom bypass", async () => {
  const rpc = vi.fn();
  await expect(
    runVerifiedOfferWrite(actor(), customRequest(), undefined, { rpc }),
  ).rejects.toMatchObject({ message: "CUSTOM_COMMIT_REQUIRED" });
  await expect(
    runVerifiedOfferWrite(actor(), request, undefined, { rpc }, true),
  ).rejects.toMatchObject({ message: "OFFER_WRITE_FAILED" });
  expect(rpc).not.toHaveBeenCalled();
});
it("mixed financial DTO distinguishes dish quote subtotal and explicit custom grand total", async () => {
  const mixed = parseOfferWriteRequest({
    ...request,
    command: {
      ...request.command,
      lines: [...request.command.lines, ...customRequest().command.lines],
    },
  });
  const context = await offerCommercialContext(actor(), tenantId);
  const rpc = vi.fn(async () => ({
    data: {
      quoteId,
      expiresAt: "2026-10-06T10:00:00+00:00",
      policyHash: context.policyHash,
      total: "2.50",
      lines: [
        {
          slotId: quoteId,
          menuId: quoteId,
          dishId: request.command.lines.filter((line) => line.kind === "dish")[0]!.dishId,
          dayDate: "2026-10-05",
          qty: 1,
          basePrice: "11.9000",
          slotPrice: "2.5000",
          unitPrice: "2.5000",
          priceSource: "slot",
          priceSnapshotStatus: "captured",
        },
      ],
    },
    error: null,
  }));
  const result = await runVerifiedOfferWrite(actor(), mixed, undefined, { rpc });
  expect(result).toMatchObject({ dishSubtotal: "2.50", customSubtotal: "6.50", total: "9.00" });
  expect(rpc).toHaveBeenCalledWith(
    "cr_order_offer_quote_issue",
    expect.objectContaining({ _command: mixed.command }),
  );
});

it("reconciliation: recovers existing committed order from canonical ledger", async () => {
  const committedOrderId = "50000000-0000-4000-8000-000000000001";
  mockAdminFrom.mockImplementation((table: string) => {
    if (table === "order_write_requests") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  order_id: committedOrderId,
                  committed_revision: 1,
                  operation: "capture",
                  created_at: "2026-10-13T10:00:00Z",
                },
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    if (table === "orders") {
      return {
        select: (cols: string) => {
          expect(cols).toBe("id, status, total, created_at");
          expect(cols).not.toContain("total_amount");
          return {
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: committedOrderId,
                    status: "draft",
                    total: 3.5,
                    created_at: "2026-10-13T10:00:00Z",
                  },
                  error: null,
                }),
              }),
            }),
          };
        },
      };
    }
    return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
  });

  const res = await runVerifiedOfferReconciliation(actor(), tenantId, request.requestId);
  expect(res).toEqual({
    reconciled: true,
    committed: true,
    requestId: request.requestId,
    order: {
      id: committedOrderId,
      status: "draft",
      total: 3.5,
      createdAt: "2026-10-13T10:00:00Z",
    },
  });
});

it("reconciliation: confirmed ledger row + unreadable order throws error and strictly preserves lock", async () => {
  const committedOrderId = "99000000-0000-4000-8000-000000000001";
  mockAdminFrom.mockImplementation((table: string) => {
    if (table === "order_write_requests") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  order_id: committedOrderId,
                  committed_revision: 1,
                  operation: "capture",
                  created_at: "2026-10-13T10:00:00Z",
                },
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    if (table === "orders") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: null,
                error: { message: "Order query failed" },
              }),
            }),
          }),
        }),
      };
    }
    return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
  });

  await expect(
    runVerifiedOfferReconciliation(actor(), tenantId, request.requestId),
  ).rejects.toMatchObject({
    code: "RECONCILIATION_ORDER_FETCH_FAILED",
  });
});

it("reconciliation: empty ledger row returns reconciled: false without timer-based automatic unlock", async () => {
  mockAdminFrom.mockImplementation((table: string) => {
    if (table === "order_write_requests") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
  });

  const res = await runVerifiedOfferReconciliation(
    actor(),
    tenantId,
    request.requestId,
  );
  expect(res).toEqual({
    reconciled: false,
    committed: false,
    requestId: request.requestId,
    order: null,
    reason: "LEDGER_RECORD_NOT_FOUND",
  });
});

it("reconciliation: late arrival of committed ledger entry safely transitions to single confirmed order", async () => {
  const committedOrderId = "99000000-0000-4000-8000-000000000001";
  let committedInPostgres = false;

  mockAdminFrom.mockImplementation((table: string) => {
    if (table === "order_write_requests") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: committedInPostgres
                  ? {
                      order_id: committedOrderId,
                      committed_revision: 1,
                      operation: "capture",
                      created_at: "2026-10-13T10:00:00Z",
                    }
                  : null,
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    if (table === "orders") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: committedOrderId,
                  status: "draft",
                  total: 3.5,
                  created_at: "2026-10-13T10:00:00Z",
                },
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
  });

  // Check 1: In-flight / delayed commit, ledger empty -> stays uncertain (reconciled: false)
  const initialCheck = await runVerifiedOfferReconciliation(actor(), tenantId, request.requestId);
  expect(initialCheck.committed).toBe(false);
  expect(initialCheck.reconciled).toBe(false);

  // Late transaction commit completes in Postgres
  committedInPostgres = true;

  // Check 2: Subsequent reconciliation check detects the single committed order without creating duplicates
  const finalCheck = await runVerifiedOfferReconciliation(actor(), tenantId, request.requestId);
  expect(finalCheck.committed).toBe(true);
  expect(finalCheck.reconciled).toBe(true);
  expect(finalCheck.order?.id).toBe(committedOrderId);
  expect(finalCheck.order?.total).toBe(3.5);
});

describe("Server-Authoritative Order Capture Gate & Defense-in-Depth", () => {
  const prodEatCleanEnv = {
    TENANT_SLUG: "eatclean",
    SUPABASE_URL: "https://nhirlpkuvonggctdzzad.supabase.co",
  };

  const eatcleanCaptureRequest = parseOfferWriteRequest({
    tenantId: EATCLEAN_TENANT_ID,
    requestId: "70000000-0000-4000-8000-000000000002",
    command: {
      operation: "capture",
      weekStart: "2026-10-05",
      customer: { kind: "existing", id: "30000000-0000-4000-8000-000000000001" },
      lines: [
        {
          kind: "dish",
          dishId: "40000000-0000-4000-8000-000000000001",
          dayDate: "2026-10-05",
          qty: 1,
        },
      ],
    },
  });

  const eatcleanModifyRequest = parseOfferWriteRequest({
    tenantId: EATCLEAN_TENANT_ID,
    requestId: "70000000-0000-4000-8000-000000000003",
    command: {
      operation: "modify",
      orderId: "50000000-0000-4000-8000-000000000001",
      expectedRevision: 1,
      weekStart: "2026-10-05",
      lines: [
        {
          kind: "dish",
          dishId: "40000000-0000-4000-8000-000000000001",
          dayDate: "2026-10-05",
          qty: 2,
        },
      ],
    },
  });

  function eatcleanActor(
    options: { role?: string; membership?: boolean } = {},
  ) {
    return {
      userId,
      supabase: {
        from(table: string) {
          const query = {
            select: () => query,
            eq: () => query,
            is: () => query,
            maybeSingle: async () => ({
              data:
                table === "tenants"
                  ? { id: EATCLEAN_TENANT_ID, slug: "eatclean" }
                  : table === "tenant_members"
                    ? options.membership === false
                      ? null
                      : { status: "approved" }
                    : null,
              error: null,
            }),
            then: (resolve: (v: unknown) => unknown) =>
              Promise.resolve({
                data: [{ role: options.role ?? "company_admin" }],
                error: null,
              }).then(resolve),
          };
          return query;
        },
      } as unknown as AppSupabase,
    };
  }

  it("authenticated user with orders.write is blocked on direct quote when staffOrderCapture is frozen in EatClean production", async () => {
    const rpc = vi.fn();
    await expect(
      runVerifiedOfferWrite(eatcleanActor(), eatcleanCaptureRequest, undefined, { rpc }, false, prodEatCleanEnv),
    ).rejects.toMatchObject({
      code: "INVALID_STATE",
      message: "Funcionalidad disponible próximamente",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("direct commit attempt of new capture is blocked with zero privileged RPCs in EatClean production", async () => {
    const rpc = vi.fn();
    await expect(
      runVerifiedOfferWrite(eatcleanActor(), eatcleanCaptureRequest, quoteId, { rpc }, false, prodEatCleanEnv),
    ).rejects.toMatchObject({
      code: "INVALID_STATE",
      message: "Funcionalidad disponible próximamente",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("direct custom commit attempt on EatClean is blocked with CUSTOM_NOT_ENABLED and zero privileged RPCs", async () => {
    const rpc = vi.fn();
    const customReq = parseOfferWriteRequest({
      ...eatcleanCaptureRequest,
      command: {
        ...eatcleanCaptureRequest.command,
        lines: [{ kind: "custom", name: "Sopa", qty: 1, dayDate: "2026-10-05", unitPrice: "5.00" }],
      },
    });
    await expect(
      runVerifiedOfferWrite(eatcleanActor(), customReq, undefined, { rpc }, true, prodEatCleanEnv),
    ).rejects.toMatchObject({
      message: "CUSTOM_NOT_ENABLED",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("unauthorized user (missing membership or orders.write) is rejected with PERMISSION_DENIED before RPC", async () => {
    const rpc = vi.fn();
    // Missing membership
    await expect(
      runVerifiedOfferWrite(eatcleanActor({ membership: false }), eatcleanCaptureRequest, undefined, { rpc }, false, prodEatCleanEnv),
    ).rejects.toMatchObject({
      code: "PERMISSION_DENIED",
    });
    // Insufficient role (kitchen role lacks orders.write)
    await expect(
      runVerifiedOfferWrite(eatcleanActor({ role: "kitchen" }), eatcleanCaptureRequest, undefined, { rpc }, false, prodEatCleanEnv),
    ).rejects.toMatchObject({
      code: "PERMISSION_DENIED",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("fails closed when synthetic variables are injected targeting production EatClean", async () => {
    const rpc = vi.fn();
    // Injected YOURMEAL_RUNTIME_ENV with production Supabase URL leak
    const leakedEnv = {
      YOURMEAL_RUNTIME_ENV: "staging_local",
      TENANT_SLUG: "eatclean",
      SUPABASE_URL: "https://nhirlpkuvonggctdzzad.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "sb_publishable_qgT9AjzgqzMPgtLRjTZaiQ_yjsQ2ChH",
    };
    await expect(
      runVerifiedOfferWrite(eatcleanActor(), eatcleanCaptureRequest, undefined, { rpc }, false, leakedEnv),
    ).rejects.toThrow("SECURITY_VIOLATION: Incomplete or mixed staging environment.");
    expect(rpc).not.toHaveBeenCalled();

    // Injected VITE_YOURMEAL_RUNTIME_ENV on server without YOURMEAL_RUNTIME_ENV
    const viteInjectedEnv = {
      ...prodEatCleanEnv,
      VITE_YOURMEAL_RUNTIME_ENV: "staging_local",
    };
    await expect(
      runVerifiedOfferWrite(eatcleanActor(), eatcleanCaptureRequest, undefined, { rpc }, false, viteInjectedEnv),
    ).rejects.toMatchObject({
      code: "INVALID_STATE",
      message: "Funcionalidad disponible próximamente",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("Demo tenant (yourmeal-os) is unaffected by EatClean capture freeze", async () => {
    const demoTenantId = "10000000-0000-4000-8000-000000000001";
    const demoEnv = {
      TENANT_SLUG: "yourmeal-os",
      SUPABASE_URL: "https://djangucecsphnejplvic.supabase.co",
    };
    registerTenantOffers("yourmeal-os", [
      {
        id: "individual_menu",
        title: "Demo",
        subtitle: "",
        description: "",
        unitLabel: "dish",
        slotsIncluded: 1,
        code: "individual_menu",
        pricingModel: "per_unit",
        basePrice: { cents: 1000, currency: "EUR", formatted: "10.00" },
        promotions: [],
      } as CommercialOffer,
    ]);
    const demoRequest = parseOfferWriteRequest({
      tenantId: demoTenantId,
      requestId: "70000000-0000-4000-8000-000000000004",
      command: {
        operation: "capture",
        weekStart: "2026-10-05",
        customer: { kind: "existing", id: "30000000-0000-4000-8000-000000000001" },
        lines: [{ kind: "dish", dishId: "40000000-0000-4000-8000-000000000001", dayDate: "2026-10-05", qty: 1 }],
      },
    });
    const rpc = vi.fn(async () => ({
      data: {
        quoteId,
        expiresAt: "2026-10-06T10:00:00+00:00",
        policyHash: (await offerCommercialContext(actor({ slug: "yourmeal-os" }), demoTenantId, demoEnv)).policyHash,
        total: "10.00",
        lines: [
          {
            slotId: quoteId,
            menuId: quoteId,
            dishId: "40000000-0000-4000-8000-000000000001",
            dayDate: "2026-10-05",
            qty: 1,
            basePrice: "10.0000",
            slotPrice: null,
            unitPrice: "10.0000",
            priceSource: "catalogue",
            priceSnapshotStatus: "captured",
          },
        ],
      },
      error: null,
    }));
    const quoteResult = await runVerifiedOfferWrite(actor({ slug: "yourmeal-os" }), demoRequest, undefined, { rpc }, false, demoEnv);
    expect(quoteResult).toBeDefined();
    expect(rpc).toHaveBeenCalledWith("cr_order_offer_quote_issue", expect.anything());
  });

  it("verified local synthetic lab allows quote and commit for EatClean staging", async () => {
    const stagingTenantId = EATCLEAN_TENANT_ID;
    const localLabEnv = {
      YOURMEAL_RUNTIME_ENV: "staging_local",
      TENANT_SLUG: "eatclean-staging",
      SUPABASE_URL: LOCAL_STAGING_URL,
      SUPABASE_PUBLISHABLE_KEY: LOCAL_STAGING_PUBLIC_KEY,
    };
    const stagingActor = {
      userId,
      supabase: {
        from(table: string) {
          const query = {
            select: () => query,
            eq: () => query,
            is: () => query,
            maybeSingle: async () => ({
              data:
                table === "tenants"
                  ? { id: stagingTenantId, slug: "eatclean" }
                  : table === "tenant_members"
                    ? { status: "approved" }
                    : null,
              error: null,
            }),
            then: (resolve: (v: unknown) => unknown) =>
              Promise.resolve({
                data: [{ role: "company_admin" }],
                error: null,
              }).then(resolve),
          };
          return query;
        },
      } as unknown as AppSupabase,
    };
    const context = await offerCommercialContext(stagingActor, stagingTenantId, localLabEnv);
    const rpc = vi.fn(async () => ({
      data: {
        quoteId,
        expiresAt: "2026-10-06T10:00:00+00:00",
        policyHash: context.policyHash,
        total: "11.90",
        lines: [
          {
            slotId: quoteId,
            menuId: quoteId,
            dishId: "40000000-0000-4000-8000-000000000001",
            dayDate: "2026-10-05",
            qty: 1,
            basePrice: "11.9000",
            slotPrice: null,
            unitPrice: "11.9000",
            priceSource: "catalogue",
            priceSnapshotStatus: "captured",
          },
        ],
      },
      error: null,
    }));
    const quoteResult = await runVerifiedOfferWrite(stagingActor, eatcleanCaptureRequest, undefined, { rpc }, false, localLabEnv);
    expect(quoteResult).toBeDefined();
    expect(rpc).toHaveBeenCalledWith("cr_order_offer_quote_issue", expect.anything());
  });

  it("allows legitimate order modification (operation: modify) on existing EatClean order without capture freeze", async () => {
    const context = await offerCommercialContext(eatcleanActor(), EATCLEAN_TENANT_ID, prodEatCleanEnv);
    const rpc = vi.fn(async () => ({
      data: {
        quoteId,
        expiresAt: "2026-10-06T10:00:00+00:00",
        policyHash: context.policyHash,
        total: "23.80",
        lines: [
          {
            slotId: quoteId,
            menuId: quoteId,
            dishId: "40000000-0000-4000-8000-000000000001",
            dayDate: "2026-10-05",
            qty: 2,
            basePrice: "11.9000",
            slotPrice: null,
            unitPrice: "11.9000",
            priceSource: "catalogue",
            priceSnapshotStatus: "captured",
          },
        ],
      },
      error: null,
    }));
    const result = await runVerifiedOfferWrite(eatcleanActor(), eatcleanModifyRequest, undefined, { rpc }, false, prodEatCleanEnv);
    expect(result).toBeDefined();
    expect(rpc).toHaveBeenCalledWith(
      "cr_order_offer_quote_issue",
      expect.objectContaining({
        _command: eatcleanModifyRequest.command,
      }),
    );
  });

  it("preserves legitimate order reconciliation on EatClean without being blocked by capture freeze", async () => {
    const committedOrderId = "50000000-0000-4000-8000-000000000001";
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "order_write_requests") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    order_id: committedOrderId,
                    committed_revision: 1,
                    operation: "capture",
                    created_at: "2026-10-13T10:00:00Z",
                  },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "orders") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: committedOrderId,
                    status: "confirmed",
                    total: 11.90,
                    created_at: "2026-10-13T10:00:00Z",
                  },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
    });

    const res = await runVerifiedOfferReconciliation(
      eatcleanActor(),
      EATCLEAN_TENANT_ID,
      eatcleanCaptureRequest.requestId,
      prodEatCleanEnv,
    );
    expect(res).toEqual({
      reconciled: true,
      committed: true,
      requestId: eatcleanCaptureRequest.requestId,
      order: {
        id: committedOrderId,
        status: "confirmed",
        total: 11.9,
        createdAt: "2026-10-13T10:00:00Z",
      },
    });
  });
});

