import { describe, expect, it } from "vitest";
import { isValidCompanyCodeFormat } from "./company-account";

describe("isValidCompanyCodeFormat", () => {
  it("accepts EC-style codes", () => {
    expect(isValidCompanyCodeFormat("EC-4821")).toBe(true);
    expect(isValidCompanyCodeFormat("EC-HOTEL-001")).toBe(true);
    expect(isValidCompanyCodeFormat("ec-clinic-023")).toBe(true);
  });

  it("rejects empty or short codes", () => {
    expect(isValidCompanyCodeFormat("")).toBe(false);
    expect(isValidCompanyCodeFormat("AB")).toBe(false);
    expect(isValidCompanyCodeFormat("EC 4821")).toBe(false);
  });
});
