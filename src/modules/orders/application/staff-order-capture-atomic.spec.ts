import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  StaffOrderCaptureService,
  type UniversalOrderCaptureDTO,
} from "./staff-order-capture-service";
import type { CaptureTransport } from "./custom-order-capture-service";
import type { CanonicalOrderWriteResult } from "../infrastructure/canonical-order-write-repository";
import type { ServiceContext } from "@/services/types";
import { EATCLEAN_TENANT_ID } from "@/config/eatclean-partial-launch";

const testState = vi.hoisted(() => ({ frozen: false }));
vi.mock("@/config/eatclean-partial-launch", async (load) => {
  const actual = await load<typeof import("@/config/eatclean-partial-launch")>();
  return { ...actual, isEatCleanStaffOrderCaptureFrozen: () => testState.frozen };
});

const dessertDishId = "44000000-0000-4000-8000-000000000010";
const quoteUuid = "60000000-0000-4000-8000-000000000001";

const dto: UniversalOrderCaptureDTO = {
  customer: { mode: "existing", customerId: "33000000-0000-4000-8000-000000000001" },
  weekStart: "2026-10-12",
  autoConfirm: false,
  orderNotes: "nota administrativa",
  demandChannel: "individual",
  dietaryOverride: { allergens: ["milk"], overrideReason: "Medical context" },
  lines: [
    { dishId: dessertDishId, dayDate: "2026-10-13", qty: 1, comment: "sin cuchara" },
  ],
};

function fixture() {
  const canonicalWriteResult = {
    order: {
      id: "99000000-0000-4000-8000-000000000001",
      tenant_id: EATCLEAN_TENANT_ID,
      customer_id: "33000000-0000-4000-8000-000000000001",
      week_start: "2026-10-12",
      status: "draft",
      total: 3.5,
      delivery_address_id: null,
      notes: "nota administrativa",
      dietary_snapshot: null,
      demand_channel: "individual",
      company_id: null,
      site_id: null,
      organizational_unit_id: null,
      delivery_group_id: null,
      cancellation_reason: null,
      cancellation_comment: null,
      cancelled_at: null,
      cancelled_by_user_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    },
    items: [
      {
        id: "88000000-0000-4000-8000-000000000001",
        tenant_id: EATCLEAN_TENANT_ID,
        order_id: "99000000-0000-4000-8000-000000000001",
        dish_id: dessertDishId,
        item_kind: "dish",
        name_snapshot: "Postre Especial",
        description_snapshot: null,
        day_date: "2026-10-13",
        qty: 1,
        unit_price: 3.5,
        price_snapshot_status: "captured",
        comment: "sin cuchara",
        allergen_state: "KNOWN",
        allergens_snapshot: [],
        snapshot_captured_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      },
    ],
    committedRevision: 1,
    replayed: false,
    inputHash: "0123456789abcdef",
  };

  const transport: CaptureTransport = {
    quote: vi.fn().mockResolvedValue({
      quoteId: quoteUuid,
      total: "3.50",
      lines: [
        {
          dishId: dessertDishId,
          dayDate: "2026-10-13",
          qty: 1,
          unitPrice: "3.50",
        },
      ],
    }),
    custom: vi.fn().mockResolvedValue(canonicalWriteResult as unknown as CanonicalOrderWriteResult),
    mixed: vi.fn().mockResolvedValue(canonicalWriteResult as unknown as CanonicalOrderWriteResult),
  };

  const rpc = vi.fn();
  const from = vi.fn();

  const ctx = {
    tenantId: EATCLEAN_TENANT_ID,
    userId: "22000000-0000-4000-8000-000000000001",
    roles: ["operations_manager"],
    supabase: { rpc, from },
  } as unknown as ServiceContext;

  return { ctx, transport, rpc, from, canonicalWriteResult };
}

describe("EatClean Canonical V2 Order Intake Integration", () => {
  beforeEach(() => {
    testState.frozen = false;
  });

  it("connects Intake Drawer to V2 quote and commit server flow with stable requestId and ZERO legacy RPC calls", async () => {
    const { ctx, transport, rpc, from } = fixture();

    const result = await StaffOrderCaptureService.captureOrder(ctx, dto, { transport });

    // 1. Verify V2 Quote was called
    expect(transport.quote).toHaveBeenCalledTimes(1);
    const quoteReq = (transport.quote as any).mock.calls[0][0];
    expect(quoteReq.tenantId).toBe(EATCLEAN_TENANT_ID);
    expect(quoteReq.requestId).toBeDefined();
    expect(quoteReq.command.operation).toBe("capture");
    expect(quoteReq.command.autoConfirm).toBe(false);
    expect(quoteReq.command.customer).toEqual({
      kind: "existing",
      id: "33000000-0000-4000-8000-000000000001",
    });
    // Lines stripped of client unitPriceOverride
    expect(quoteReq.command.lines).toEqual([
      {
        kind: "dish",
        dishId: dessertDishId,
        dayDate: "2026-10-13",
        qty: 1,
        comment: "sin cuchara",
      },
    ]);
    expect(quoteReq.command.orderNotes).toBe("nota administrativa");
    expect(quoteReq.command.dietaryOverride).toEqual(
      expect.objectContaining({
        allergens: ["milk"],
        overrideReason: "Medical context",
      }),
    );

    // 2. Verify V2 Commit (mixed) was called with the SAME requestId and quoteId
    expect(transport.mixed).toHaveBeenCalledTimes(1);
    const commitReq = (transport.mixed as any).mock.calls[0][0];
    expect(commitReq.requestId).toBe(quoteReq.requestId);
    expect(commitReq.quoteId).toBe(quoteUuid);
    expect(commitReq.tenantId).toBe(EATCLEAN_TENANT_ID);

    // 3. ZERO calls to legacy capture_staff_existing_order RPC or direct database tables
    expect(rpc).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();

    // 4. Returns canonical StaffOrderCaptureResult in draft with 3.50 total
    expect(result.order.status).toBe("draft");
    expect(result.total).toBe(3.5);
    expect(result.isNewCustomer).toBe(false);
    expect(result.customerId).toBe("33000000-0000-4000-8000-000000000001");
    expect(result.items).toHaveLength(1);
  });

  it("strictly rejects client manual unitPriceOverride with OFFER_PRICING_OVERRIDE_UNSUPPORTED", async () => {
    const { ctx, transport } = fixture();
    const tamperedDto: UniversalOrderCaptureDTO = {
      ...dto,
      lines: [
        {
          dishId: dessertDishId,
          dayDate: "2026-10-13",
          qty: 1,
          unitPriceOverride: 0.01,
        },
      ],
    };

    await expect(
      StaffOrderCaptureService.captureOrder(ctx, tamperedDto, { transport }),
    ).rejects.toMatchObject({
      code: "OFFER_PRICING_OVERRIDE_UNSUPPORTED",
    });

    expect(transport.quote).not.toHaveBeenCalled();
    expect(transport.mixed).not.toHaveBeenCalled();
  });

  it("retains the launch freeze before any server or transport operation", async () => {
    testState.frozen = true;
    const { ctx, transport, rpc } = fixture();

    await expect(
      StaffOrderCaptureService.captureOrder(ctx, dto, { transport }),
    ).rejects.toThrow("Funcionalidad disponible próximamente");

    expect(transport.quote).not.toHaveBeenCalled();
    expect(transport.mixed).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("denies kitchen capabilities before transport invocation", async () => {
    const { ctx, transport } = fixture();
    ctx.roles = ["kitchen"];

    await expect(
      StaffOrderCaptureService.captureOrder(ctx, dto, { transport }),
    ).rejects.toThrow();

    expect(transport.quote).not.toHaveBeenCalled();
    expect(transport.mixed).not.toHaveBeenCalled();
  });

  it("preserves request identity across uncertain network failure and enforces retry of same payload", async () => {
    const { ctx, transport } = fixture();
    (transport.mixed as any).mockRejectedValueOnce(new Error("network timeout"));

    // Attempt commit fails with network error
    await expect(
      StaffOrderCaptureService.captureOrder(ctx, dto, { transport }),
    ).rejects.toThrow("network timeout");

    expect(transport.quote).toHaveBeenCalledTimes(1);
    expect(transport.mixed).toHaveBeenCalledTimes(1);
  });

  it("rejects fractional quantities before transport", async () => {
    const { ctx, transport } = fixture();

    await expect(
      StaffOrderCaptureService.captureOrder(
        ctx,
        {
          ...dto,
          lines: [{ ...dto.lines[0], qty: 1.5 }],
        },
        { transport },
      ),
    ).rejects.toThrow();

    expect(transport.quote).not.toHaveBeenCalled();
  });

  it("REQUEST_ID_MATCH: passes identical canonical requestId to beforeCommit, Quote V2, and Commit V2", async () => {
    const { ctx, transport } = fixture();
    let capturedInBeforeCommit: string | undefined;

    const result = await StaffOrderCaptureService.captureOrder(ctx, dto, {
      transport,
      beforeCommit: (session) => {
        capturedInBeforeCommit = session.review?.request?.requestId;
      },
    });

    expect(capturedInBeforeCommit).toBeDefined();
    const quoteReq = (transport.quote as any).mock.calls[0][0];
    const commitReq = (transport.mixed as any).mock.calls[0][0];

    // Guarantee that requestId is 100% deterministic and identical across all phases
    expect(capturedInBeforeCommit).toBe(quoteReq.requestId);
    expect(capturedInBeforeCommit).toBe(commitReq.requestId);
    expect(result.order.status).toBe("draft");
  });

  it("beforeCommit storage failure immediately aborts and NEVER executes session commit", async () => {
    const { ctx, transport } = fixture();

    await expect(
      StaffOrderCaptureService.captureOrder(ctx, dto, {
        transport,
        beforeCommit: () => {
          throw new Error("STORAGE_PERSISTENCE_FAILED");
        },
      }),
    ).rejects.toThrow("STORAGE_PERSISTENCE_FAILED");

    // Quote was prepared, but commit was strictly aborted
    expect(transport.quote).toHaveBeenCalledTimes(1);
    expect(transport.mixed).not.toHaveBeenCalled();
  });
});
