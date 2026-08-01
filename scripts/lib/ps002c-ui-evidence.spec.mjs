import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  classifyPs002cAuthUiState,
  formatPs002cFormTimeoutReason,
} from "./ps002c-ui-evidence.mjs";

describe("classifyPs002cAuthUiState", () => {
  it("detects redirect away from /auth", () => {
    assert.equal(
      classifyPs002cAuthUiState({
        url: "http://127.0.0.1:8080/admin",
        bodyText: "Centro de Operaciones",
        signals: {},
      }),
      "redirect",
    );
  });

  it("detects bootstrap mode", () => {
    assert.equal(
      classifyPs002cAuthUiState({
        url: "http://127.0.0.1:8080/auth/admin",
        bodyText: "Entrar",
        signals: { hasBootstrapProfile: true },
      }),
      "bootstrap_mode",
    );
  });

  it("detects form when email+password present", () => {
    assert.equal(
      classifyPs002cAuthUiState({
        url: "http://127.0.0.1:8080/auth/admin",
        bodyText: "Centro de Operaciones",
        signals: { hasEmailInput: true, hasPasswordInput: true },
      }),
      "form",
    );
  });

  it("detects checkingSession from loading text", () => {
    assert.equal(
      classifyPs002cAuthUiState({
        url: "http://127.0.0.1:8080/auth/admin",
        bodyText: "Centro de Operaciones\nCargando…",
        signals: { hasEmailInput: false },
      }),
      "checkingSession",
    );
  });

  it("detects bootstrapError from retry + error copy", () => {
    assert.equal(
      classifyPs002cAuthUiState({
        url: "http://127.0.0.1:8080/auth/admin",
        bodyText:
          "No pudimos contactar el servicio de autenticación. Comprueba tu conexión.",
        signals: { hasRetryButton: true, hasEmailInput: false },
      }),
      "bootstrapError",
    );
  });

  it("detects nonStaffSession", () => {
    assert.equal(
      classifyPs002cAuthUiState({
        url: "http://127.0.0.1:8080/auth/admin",
        bodyText:
          "Tu sesión actual es de cliente. Cierra sesión e inicia con una cuenta de personal.",
        signals: { hasSwitchAccount: true, hasEmailInput: false },
      }),
      "nonStaffSession",
    );
  });

  it("returns unknown when signals are empty", () => {
    assert.equal(
      classifyPs002cAuthUiState({
        url: "http://127.0.0.1:8080/auth/admin",
        bodyText: "",
        signals: {},
      }),
      "unknown",
    );
  });
});

describe("formatPs002cFormTimeoutReason", () => {
  it("includes UI State and screenshot paths", () => {
    const reason = formatPs002cFormTimeoutReason({
      uiState: "checkingSession",
      url: "http://127.0.0.1:8080/auth/admin",
      route: "/auth/admin",
      bodyText: "Cargando…",
      screenshotRel: "docs/.../ps002c-form-timeout.png",
      jsonRel: "docs/.../ps002c-form-timeout.json",
    });
    assert.match(reason, /UI State:\ncheckingSession/);
    assert.match(reason, /Cargando/);
    assert.match(reason, /ps002c-form-timeout\.png/);
    assert.match(reason, /Auth form not available/);
  });
});
