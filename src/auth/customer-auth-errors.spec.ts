import { describe, expect, it } from "vitest";
import { classifyCustomerAuthError } from "./customer-auth-errors";

describe("classifyCustomerAuthError", () => {
  it("maps invalid_credentials (observed Auth API shape) to safe credentials message", () => {
    const classified = classifyCustomerAuthError({
      message: "Invalid login credentials",
      code: "invalid_credentials",
      status: 400,
    });
    expect(classified.kind).toBe("invalid_credentials");
    expect(classified.messageKey).toBe("signInInvalidCredentials");
  });

  it("does not claim account-missing when backend only says invalid credentials", () => {
    const classified = classifyCustomerAuthError({
      message: "Invalid login credentials",
      code: "invalid_credentials",
      status: 400,
    });
    expect(classified.messageKey).not.toMatch(/notExist|doesNotExist|noExiste/i);
    expect(classified.kind).toBe("invalid_credentials");
  });

  it("classifies email not confirmed when backend differentiates", () => {
    expect(
      classifyCustomerAuthError({
        message: "Email not confirmed",
        code: "email_not_confirmed",
        status: 400,
      }).kind,
    ).toBe("email_not_confirmed");
  });

  it("classifies rate limit", () => {
    expect(
      classifyCustomerAuthError({
        message: "Request rate limit reached",
        code: "over_request_rate_limit",
        status: 429,
      }).kind,
    ).toBe("rate_limit");
  });

  it("classifies network failures", () => {
    expect(classifyCustomerAuthError(new TypeError("Failed to fetch")).kind).toBe(
      "network",
    );
  });

  it("defaults unexpected errors to non-technical key", () => {
    const classified = classifyCustomerAuthError(
      new Error("JWT malformed RPC 42P17"),
    );
    expect(classified.kind).toBe("unexpected");
    expect(classified.messageKey).toBe("signInUnexpected");
  });
});
