import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  StaffOrderCaptureService,
  type UniversalOrderCaptureDTO,
} from "./staff-order-capture-service";
import { createStaffExistingOrderRepository } from "../infrastructure/staff-existing-order-repository";
import type { ServiceContext } from "@/services/types";
import { EATCLEAN_TENANT_ID } from "@/config/eatclean-partial-launch";
const testState = vi.hoisted(() => ({ frozen: false }));
vi.mock("@/config/eatclean-partial-launch", async (load) => {
  const actual = await load<typeof import("@/config/eatclean-partial-launch")>();
  return { ...actual, isEatCleanStaffOrderCaptureFrozen: () => testState.frozen };
});
const dto: UniversalOrderCaptureDTO = {
  customer: { mode: "existing", customerId: "customer" },
  weekStart: "2026-10-12",
  autoConfirm: true,
  orderNotes: "note",
  demandChannel: "company",
  companyId: "company",
  siteId: "site",
  organizationalUnitId: "unit",
  dietaryOverride: { allergens: ["milk"], overrideReason: "Medical context" },
  lines: [
    { dishId: "dish", dayDate: "2026-10-12", qty: 2, comment: "no salt", unitPriceOverride: 9 },
  ],
};
function fixture() {
  const result = {
    order: { id: "order", total: 18, status: "confirmed" },
    items: [{ id: "line" }],
    customerId: "customer",
    isNewCustomer: false,
    total: 18,
  };
  const rpc = vi.fn().mockResolvedValue({ data: result, error: null });
  const from = vi.fn(() => {
    throw new Error("Unexpected separate database call");
  });
  const ctx = {
    tenantId: EATCLEAN_TENANT_ID,
    userId: "staff",
    roles: ["operations_manager"],
    supabase: { rpc, from },
  } as unknown as ServiceContext;
  return { ctx, rpc, from, result };
}
describe("EatClean existing staff intake atomic boundary", () => {
  beforeEach(() => {
    testState.frozen = false;
  });
  it("uses a single RPC preserving confirmation, comments, override, dietary and company context", async () => {
    const { ctx, rpc, from, result } = fixture();
    expect(await StaffOrderCaptureService.captureOrder(ctx, dto)).toEqual(result);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("capture_staff_existing_order", {
      _tenant_id: EATCLEAN_TENANT_ID,
      _command: expect.objectContaining({
        customerId: "customer",
        autoConfirm: true,
        lines: dto.lines,
        dietaryOverride: dto.dietaryOverride,
        companyId: "company",
        siteId: "site",
        organizationalUnitId: "unit",
        orderNotes: "note",
      }),
    });
    expect(from).not.toHaveBeenCalled();
  });
  it("retains the launch freeze before any database operation", async () => {
    testState.frozen = true;
    const { ctx, rpc, from } = fixture();
    await expect(StaffOrderCaptureService.captureOrder(ctx, dto)).rejects.toThrow(
      "Funcionalidad disponible próximamente",
    );
    expect(rpc).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });
  it("denies kitchen capabilities before persistence", async () => {
    const { ctx, rpc } = fixture();
    ctx.roles = ["kitchen"];
    await expect(StaffOrderCaptureService.captureOrder(ctx, dto)).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });
  it("does not retry or fall back to separate writes when the RPC fails", async () => {
    const { ctx, rpc, from } = fixture();
    rpc.mockResolvedValue({ data: null, error: { message: "synthetic failure" } });
    await expect(StaffOrderCaptureService.captureOrder(ctx, dto)).rejects.toThrow(
      "No se pudo guardar el pedido completo",
    );
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(from).not.toHaveBeenCalled();
  });
  it("does not retry an uncertain transport failure", async () => {
    const { ctx, rpc, from } = fixture();
    rpc.mockRejectedValue(new Error("network response lost"));
    await expect(StaffOrderCaptureService.captureOrder(ctx, dto)).rejects.toThrow(
      "network response lost",
    );
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(from).not.toHaveBeenCalled();
  });
  it("rejects fractional quantities before RPC", async () => {
    const { ctx, rpc } = fixture();
    await expect(
      StaffOrderCaptureService.captureOrder(ctx, {
        ...dto,
        lines: [{ ...dto.lines[0], qty: 1.5 }],
      }),
    ).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });
  it("does not pass an asserted total or authenticated actor from the caller", async () => {
    const { ctx, rpc } = fixture();
    await StaffOrderCaptureService.captureOrder(ctx, dto);
    const payload = rpc.mock.calls[0][1]._command;
    expect(payload).not.toHaveProperty("total");
    expect(payload).not.toHaveProperty("actorId");
    expect(payload).not.toHaveProperty("dietarySnapshot");
  });
  it("does not accept new customer provisioning at this repository boundary", async () => {
    const { ctx, rpc } = fixture();
    await expect(
      createStaffExistingOrderRepository(ctx.supabase).capture(ctx.tenantId, {
        ...dto,
        customer: { mode: "new", displayName: "Synthetic", phone: "000" },
      }),
    ).rejects.toThrow("Existing customer required");
    expect(rpc).not.toHaveBeenCalled();
  });
});
