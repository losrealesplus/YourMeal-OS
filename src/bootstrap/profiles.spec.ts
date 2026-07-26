import { describe, expect, it } from "vitest";
import {
  BOOTSTRAP_PROFILES,
  getBootstrapProfile,
  getBootstrapProfileByUserId,
} from "./profiles";
import { homePathForRoles } from "@/lib/home-path";

describe("bootstrap profiles", () => {
  it("defines all required profiles", () => {
    const ids = BOOTSTRAP_PROFILES.map((p) => p.id);
    expect(ids).toEqual([
      "customer",
      "kitchen",
      "delivery",
      "support",
      "finance",
      "company_admin",
      "saas_admin",
    ]);
  });

  it("maps Finance to accounting role", () => {
    expect(getBootstrapProfile("finance")?.roles).toEqual(["accounting"]);
  });

  it("maps SaaS Admin to company_admin + saas_admin", () => {
    expect(getBootstrapProfile("saas_admin")?.roles).toEqual([
      "company_admin",
      "saas_admin",
    ]);
  });

  it("routes homes correctly", () => {
    expect(homePathForRoles(getBootstrapProfile("customer")!.roles)).toBe("/app");
    expect(homePathForRoles(getBootstrapProfile("company_admin")!.roles)).toBe(
      "/admin",
    );
    expect(homePathForRoles(getBootstrapProfile("saas_admin")!.roles)).toBe(
      "/admin",
    );
    expect(homePathForRoles(getBootstrapProfile("kitchen")!.roles)).toBe(
      "/admin/kitchen",
    );
  });

  it("resolves by userId", () => {
    const p = getBootstrapProfile("customer")!;
    expect(getBootstrapProfileByUserId(p.userId)?.id).toBe("customer");
  });
});
