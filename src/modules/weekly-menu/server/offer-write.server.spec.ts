import { beforeEach, expect, it, vi } from "vitest";
import { clearTenantOffersRegistry, registerTenantOffers } from "@/modules/commercial";
import type { CommercialOffer } from "@/modules/commercial";
import type { AppSupabase } from "@/services/types";
import { offerCommercialContext, runVerifiedOfferWrite } from "./offer-write.server";
import { parseOfferWriteRequest } from "../application/offer-write-input";
vi.mock("@/tenant/commercial-config", () => ({}));
vi.mock("@/tenant/resources/brand.json", () => ({ default: { slug: "test-tenant" } }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc: vi.fn() } }));
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
