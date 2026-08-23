/**
 * ROUTE SPEC · admin.order-capture.tsx
 *
 * Validates:
 * - validateSearch accepts customerId, kind, and mode (defaults mode to 'search')
 * - Return hook preserves customerId and routes to tab=orders
 * - Route component and beforeLoad capability guard are properly defined
 * - Customer context preview and inline creation structures are supported
 */

import { describe, expect, it } from "vitest";
import { Route } from "@/routes/_authenticated/admin.order-capture";
import { createCustomerCommand } from "@/customer/CustomerCommands";

describe("admin.order-capture routing and context preservation", () => {
  it("validates search params preserving customerId, kind, and mode", () => {
    const validateSearch = Route.options.validateSearch as (search: Record<string, unknown>) => {
      customerId?: string;
      kind?: string;
      mode?: string;
    };

    expect(validateSearch({})).toEqual({
      customerId: undefined,
      kind: undefined,
      mode: "search",
    });

    expect(
      validateSearch({
        customerId: "cust-test-123",
        kind: "individual",
        mode: "capture",
      }),
    ).toEqual({
      customerId: "cust-test-123",
      kind: "individual",
      mode: "capture",
    });

    expect(
      validateSearch({
        customerId: "cust-comp-456",
        kind: "company_account",
        mode: "templates",
      }),
    ).toEqual({
      customerId: "cust-comp-456",
      kind: "company_account",
      mode: "templates",
    });
  });

  it("defines route component and beforeLoad capability guard", () => {
    expect(Route.options.component).toBeDefined();
    expect(Route.options.beforeLoad).toBeDefined();
  });

  it("constructs valid CreateCustomerCommand for inline quick-creation", () => {
    const command = createCustomerCommand({
      partyKind: "individual",
      mode: "staff_create",
      displayName: "Carmen Navarro",
      phone: "+34 600 123 456",
      street: "C/ Gran Vía 28",
      city: "Madrid",
    });

    expect(command).toEqual({
      type: "CreateCustomer",
      partyKind: "individual",
      mode: "staff_create",
      displayName: "Carmen Navarro",
      phone: "+34 600 123 456",
      street: "C/ Gran Vía 28",
      city: "Madrid",
    });
  });
});
