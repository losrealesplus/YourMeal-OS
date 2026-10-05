import { expect, it, vi } from "vitest";
import type { ServiceContext } from "@/services/types";
vi.mock("@/permissions", () => ({ requireCapability: vi.fn() }));
import { KitchenExecutionService } from "./kitchen-execution-service";
it("custom batch commands stop before any database write", async () => {
  const from = vi.fn();
  const ctx = { roles: ["kitchen"], supabase: { from } } as unknown as ServiceContext;
  for (const command of [
    {
      deliveryDate: "2026-10-05",
      dishId: "",
      itemKind: "custom" as const,
      toStatus: "preparing" as const,
    },
    { deliveryDate: "2026-10-05", dishId: "custom:item-a", toStatus: "preparing" as const },
  ])
    await expect(KitchenExecutionService.transitionBatch(ctx, command)).rejects.toThrow(
      "Custom batch writes are not enabled",
    );
  expect(from).not.toHaveBeenCalled();
});
