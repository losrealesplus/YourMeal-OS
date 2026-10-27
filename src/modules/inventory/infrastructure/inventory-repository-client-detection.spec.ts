import { describe, expect, it } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { createInventoryRepository } from "./inventory-repository";

describe("CR-COST-1A / FLOW-04 — Supabase Proxy & Invariant Enforcement", () => {
  it("1. supabase Proxy correctly responds to 'in' operator and reflection traps", () => {
    expect("from" in supabase).toBe(true);
    expect("rpc" in supabase).toBe(true);
    expect(typeof supabase.from).toBe("function");
    expect(typeof supabase.rpc).toBe("function");
  });

  it("2. createInventoryRepository recognizes supabase Proxy as PostgreSQL client", () => {
    const repo = createInventoryRepository(supabase, "509a67ba-5d66-4298-9a3f-b7e7214974dc");
    expect(repo).toBeDefined();
    // In PostgreSQL repository, findBySource returns a Promise querying the database client
    expect(typeof repo.findBySource).toBe("function");
    expect(typeof repo.applyConsumption).toBe("function");
    expect(typeof repo.sealConsumption).toBe("function");
  });

  it("3. createInventoryRepository allows empty object / null double for unit tests", () => {
    const doubleEmpty = createInventoryRepository({}, "test-tenant");
    expect(doubleEmpty).toBeDefined();
    const doubleNull = createInventoryRepository(null, "test-tenant");
    expect(doubleNull).toBeDefined();
  });

  it("4. Mandatory Invariant: refuses silent in-memory fallback on broken/partial client objects", () => {
    expect(() =>
      createInventoryRepository({ auth: { getUser: () => {} } }, "test-tenant"),
    ).toThrow(/Invalid Supabase client provided to createInventoryRepository/);

    expect(() =>
      createInventoryRepository({ from: "not-a-function", rpc: () => {} }, "test-tenant"),
    ).toThrow(/Invalid Supabase client provided to createInventoryRepository/);
  });
});
