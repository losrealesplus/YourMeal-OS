import { describe, expect, it } from "vitest";
import {
  isPlatformOwnerEmail,
  PLATFORM_OWNER_EMAILS,
} from "./platform-owners";

describe("platform-owners (OP-002)", () => {
  it("lists the two permanent Platform Owner emails", () => {
    expect(PLATFORM_OWNER_EMAILS).toEqual([
      "alex1409h@gmail.com",
      "alexhdezmtinez@gmail.com",
    ]);
  });

  it("matches allowlisted emails case-insensitively", () => {
    expect(isPlatformOwnerEmail("Alex1409h@gmail.com")).toBe(true);
    expect(isPlatformOwnerEmail("  alexhdezmtinez@gmail.com ")).toBe(true);
  });

  it("rejects non-owners and empty values", () => {
    expect(isPlatformOwnerEmail("test-mixed@example.com")).toBe(false);
    expect(isPlatformOwnerEmail(null)).toBe(false);
    expect(isPlatformOwnerEmail("")).toBe(false);
  });
});
