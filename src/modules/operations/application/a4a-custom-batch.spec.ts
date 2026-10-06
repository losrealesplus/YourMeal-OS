import { expect, it, vi } from "vitest";
import type { ServiceContext } from "@/services/types";
import { KitchenExecutionService } from "./kitchen-execution-service";
const tenantId = "10000000-0000-4000-8000-000000000001";
const orderItemId = "80000000-0000-4000-8000-000000000001";
const input = { orderItemId, deliveryDate: "2026-10-05", toStatus: "preparing" };
const context = (rpc: unknown, roles = ["kitchen"]) =>
  ({ tenantId, userId: "actor", roles, supabase: { rpc } }) as unknown as ServiceContext;
it("uses per-item UUID plus day and leaves actor authority in DB", async () => {
  const rpc = vi.fn(async () => ({
    data: {
      id: orderItemId,
      tenant_id: tenantId,
      item_kind: "custom",
      dish_id: null,
      custom_order_item_id: orderItemId,
      delivery_date: input.deliveryDate,
      status: "preparing",
    },
    error: null,
  }));
  expect(await KitchenExecutionService.transitionCustomBatch(context(rpc), input)).toBe(
    "preparing",
  );
  expect(rpc).toHaveBeenCalledWith("cr_order_custom_batch_transition", {
    _tenant_id: tenantId,
    _order_item_id: orderItemId,
    _delivery_date: "2026-10-05",
    _to_status: "preparing",
  });
});
it.each([
  { orderItemId: "custom:Sopa" },
  { dishId: orderItemId },
  { deliveryDate: "2026-02-30" },
  { toStatus: "pending" },
  { actorId: "other" },
])("rejects malformed/authority bypass %j", async (patch) => {
  const rpc = vi.fn();
  await expect(
    KitchenExecutionService.transitionCustomBatch(context(rpc), { ...input, ...patch }),
  ).rejects.toMatchObject({ code: "INVALID_STATE" });
  expect(rpc).not.toHaveBeenCalled();
});
it("requires kitchen capability", async () => {
  const rpc = vi.fn();
  await expect(
    KitchenExecutionService.transitionCustomBatch(context(rpc, ["customer"]), input),
  ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
  expect(rpc).not.toHaveBeenCalled();
});
it("closed gate remains a typed rejection without raw provider messages", async () => {
  await expect(
    KitchenExecutionService.transitionCustomBatch(
      context(async () => ({ data: null, error: { message: "CUSTOM_NOT_ENABLED" } })),
      input,
    ),
  ).rejects.toMatchObject({ code: "CUSTOM_NOT_ENABLED" });
  await expect(
    KitchenExecutionService.transitionCustomBatch(
      context(async () => {
        throw Error("SECRET");
      }),
      input,
    ),
  ).rejects.toMatchObject({ message: "Custom batch transition unavailable" });
});
it("does not acknowledge malformed committed response", async () => {
  await expect(
    KitchenExecutionService.transitionCustomBatch(
      context(async () => ({ data: "finished", error: null })),
      input,
    ),
  ).rejects.toMatchObject({ code: "INVALID_STATE" });
});
