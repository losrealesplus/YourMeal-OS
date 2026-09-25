import { describe, it, expect } from "vitest";
import { formatErrorMessage, DomainError } from "./errors";

describe("formatErrorMessage", () => {
  it("extracts message from standard Error", () => {
    const err = new Error("Falló la conexión");
    expect(formatErrorMessage(err)).toBe("Falló la conexión");
  });

  it("extracts message from DomainError", () => {
    const err = new DomainError("PERMISSION_DENIED", "Permiso denegado");
    expect(formatErrorMessage(err)).toBe("Permiso denegado");
  });

  it("extracts message from PostgREST plain error object", () => {
    const postgrestErr = {
      code: "PGRST200",
      details: "Searched for relationship...",
      hint: "Add explicit alias",
      message: "Could not find a relationship between tables",
    };
    expect(formatErrorMessage(postgrestErr)).toBe("Could not find a relationship between tables");
  });

  it("extracts details when message is empty or [object Object]", () => {
    const postgrestErr = {
      code: "PGRST200",
      details: "No foreign key found",
      message: "[object Object]",
    };
    expect(formatErrorMessage(postgrestErr)).toBe("No foreign key found");
  });

  it("extracts error_description if present", () => {
    const authErr = {
      error_description: "Invalid login credentials",
    };
    expect(formatErrorMessage(authErr)).toBe("Invalid login credentials");
  });

  it("never returns '[object Object]' for arbitrary empty objects", () => {
    const weirdObj = {};
    expect(formatErrorMessage(weirdObj)).toBe("Ha ocurrido un error inesperado.");
    expect(formatErrorMessage(weirdObj)).not.toContain("[object Object]");
  });

  it("returns fallback for null or undefined", () => {
    expect(formatErrorMessage(null)).toBe("Ha ocurrido un error inesperado.");
    expect(formatErrorMessage(undefined)).toBe("Ha ocurrido un error inesperado.");
  });

  it("uses custom fallback if provided", () => {
    expect(formatErrorMessage(null, "Error al cargar soporte")).toBe("Error al cargar soporte");
  });

  it("preserves plain strings", () => {
    expect(formatErrorMessage("Error de red")).toBe("Error de red");
  });
});
