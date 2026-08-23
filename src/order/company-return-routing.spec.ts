import { describe, expect, it } from "vitest";
import { Route } from "@/routes/_authenticated/admin.companies";

describe("H2 — B2B Contextual Return Hook Routing", () => {
  const validateSearch = Route.options.validateSearch as (search: Record<string, unknown>) => {
    companyId?: string;
    fromCustomerId?: string;
  };

  it("parses empty search params safely with undefined fallbacks", () => {
    const parsed = validateSearch({});
    expect(parsed).toEqual({
      companyId: undefined,
      fromCustomerId: undefined,
    });
  });

  it("parses companyId and fromCustomerId correctly when both are present", () => {
    const parsed = validateSearch({
      companyId: "comp-acme-001",
      fromCustomerId: "cust-carlos-123",
    });
    expect(parsed).toEqual({
      companyId: "comp-acme-001",
      fromCustomerId: "cust-carlos-123",
    });
  });

  it("normalizes malformed types (non-strings) to undefined without crashing", () => {
    const parsed = validateSearch({
      companyId: 12345,
      fromCustomerId: { bad: true },
    });
    expect(parsed).toEqual({
      companyId: undefined,
      fromCustomerId: undefined,
    });
  });
});
