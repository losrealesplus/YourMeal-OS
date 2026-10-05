import { describe, expect, it, vi } from "vitest";
import type { AppSupabase } from "@/services/types";
import { createWeeklyMenuRepository } from "./weekly-menu-repository";

function client() {
  const calls: unknown[][] = [];
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq", "is", "order", "insert"])
    chain[method] = vi.fn((...args: unknown[]) => {
      calls.push([method, ...args]);
      return chain;
    });
  chain.single = vi.fn(async () => ({ data: {}, error: null }));
  chain.maybeSingle = vi.fn(async () => ({ data: null, error: null }));
  chain.then = (resolve: (value: unknown) => unknown) => resolve({ data: [], error: null });
  const from = vi.fn(() => chain);
  return { calls, from, supabase: { from } as unknown as AppSupabase };
}
const input = { weeklyMenuId: "m1", dayDate: "2026-10-05", dishId: "d1" };
describe("M1 persistence compatibility", () => {
  it.each([undefined, null, 0, 2.5])(
    "preserves nullable write shape %s without touching dishes",
    async (unitPrice) => {
      const db = client();
      await createWeeklyMenuRepository(db.supabase, "t1").addSlot({ ...input, unitPrice });
      const row = db.calls.find((call) => call[0] === "insert")?.[1] as Record<string, unknown>;
      expect(row.tenant_id).toBe("t1");
      if (unitPrice === undefined) expect(row).not.toHaveProperty("unit_price");
      else expect(row.unit_price).toBe(unitPrice);
      expect(db.from).toHaveBeenCalledTimes(1);
      expect(db.from).toHaveBeenCalledWith("weekly_menu_slots");
    },
  );
  it.each([-1, Infinity, NaN, 1.00001, 100000000])(
    "rejects invalid bulk input before network writes %s",
    async (unitPrice) => {
      const db = client();
      await expect(
        createWeeklyMenuRepository(db.supabase, "t1").addSlots([{ ...input, unitPrice }]),
      ).rejects.toThrow("PRICE_UNAVAILABLE");
      expect(db.calls.some((call) => call[0] === "insert")).toBe(false);
    },
  );
  it("filters slot lookups and published menu selection by effective tenant", async () => {
    const db = client();
    const repo = createWeeklyMenuRepository(db.supabase, "t1");
    await repo.getSlotById("s1");
    await repo.findPublishedByWeekStart("2026-10-05");
    expect(db.calls.filter((call) => call[0] === "eq" && call[1] === "tenant_id")).toEqual([
      ["eq", "tenant_id", "t1"],
      ["eq", "tenant_id", "t1"],
    ]);
  });
});
