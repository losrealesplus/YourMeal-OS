import { describe, expect, it } from "vitest";
import {
  resolveOperationsEntry,
  workspacesForRoles,
} from "@/lib/operations-workspaces";
import type { AppRole } from "@/hooks/use-auth";

describe("operations workspaces (presentation)", () => {
  it("admin always gets Operations Center with all workspaces", () => {
    const roles: AppRole[] = ["company_admin"];
    const entry = resolveOperationsEntry(roles);
    expect(entry.kind).toBe("center");
    if (entry.kind === "center") {
      expect(entry.workspaces.map((w) => w.id)).toEqual([
        "kitchen",
        "delivery",
        "stock",
        "support",
        "administration",
        "finance",
      ]);
    }
  });

  it("single kitchen role enters kitchen workspace directly", () => {
    const entry = resolveOperationsEntry(["kitchen"]);
    expect(entry).toEqual({
      kind: "direct",
      path: "/admin/kitchen",
      workspace: expect.objectContaining({ id: "kitchen" }),
    });
  });

  it("single support role enters support workspace directly", () => {
    const entry = resolveOperationsEntry(["support"]);
    expect(entry).toEqual({
      kind: "direct",
      path: "/admin/support",
      workspace: expect.objectContaining({ id: "support" }),
    });
  });

  it("single accounting role enters finance workspace directly", () => {
    const entry = resolveOperationsEntry(["accounting"]);
    expect(entry).toEqual({
      kind: "direct",
      path: "/admin/accounting",
      workspace: expect.objectContaining({ id: "finance" }),
    });
  });

  it("never lists locked workspaces for a logistics employee", () => {
    const ids = workspacesForRoles(["logistics"]).map((w) => w.id);
    expect(ids).toEqual(["delivery"]);
  });

  it("multi-role employee sees picker with only authorized workspaces", () => {
    const entry = resolveOperationsEntry(["kitchen", "logistics"]);
    expect(entry.kind).toBe("center");
    if (entry.kind === "center") {
      expect(entry.workspaces.map((w) => w.id)).toEqual(["kitchen", "delivery"]);
    }
  });
});
