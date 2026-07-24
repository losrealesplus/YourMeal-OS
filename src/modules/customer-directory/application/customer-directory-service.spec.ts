import { describe, expect, it } from "vitest";
import {
  deriveCustomerStatus,
  RECURRING_MIN_ORDERS,
} from "@/modules/customer-directory/domain/customer-directory";
import { CustomerDirectoryService } from "@/modules/customer-directory";

describe("customer directory domain", () => {
  it("marks brand-new customers without orders as new", () => {
    const status = deriveCustomerStatus({
      createdAt: new Date().toISOString(),
      lastOrderAt: null,
      orderCount: 0,
    });
    expect(status).toBe("new");
  });

  it("marks recent buyers as active", () => {
    const status = deriveCustomerStatus({
      createdAt: "2025-01-01T00:00:00Z",
      lastOrderAt: new Date().toISOString(),
      orderCount: 3,
    });
    expect(status).toBe("active");
  });

  it("marks stale buyers as inactive", () => {
    const status = deriveCustomerStatus({
      createdAt: "2024-01-01T00:00:00Z",
      lastOrderAt: "2024-06-01T00:00:00Z",
      orderCount: 2,
    });
    expect(status).toBe("inactive");
  });

  it("exports CSV with header for particulares", () => {
    const csv = CustomerDirectoryService.toIndividualsCsv([
      {
        id: "c1",
        displayName: "Ana",
        email: "ana@example.com",
        phone: null,
        kind: "individual",
        status: "active",
        createdAt: "2026-01-01T00:00:00Z",
        lastOrderAt: null,
        orderCount: RECURRING_MIN_ORDERS,
        averageTicket: 12.5,
        lifetimeTotal: 25,
        companyId: null,
        companyName: null,
        companyCode: null,
        city: "Madrid",
      },
    ]);
    expect(csv.split("\n")[0]).toContain("nombre");
    expect(csv).toContain("Ana");
  });
});
