import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildAuthNet003Evidence,
  formatAuthNet003Report,
  redactSecret,
  summarizeResponseBody,
} from "./ps002c-network-evidence.mjs";

describe("ps002c-network-evidence (AUTH-NET-003)", () => {
  it("redacts secrets", () => {
    const r = redactSecret("sb_publishable_abcdefghijklmnop");
    assert.match(r, /^sb_publishab/);
    assert.match(r, /len=/);
  });

  it("summarizes auth token JSON without leaking JWT", () => {
    const summary = summarizeResponseBody(
      JSON.stringify({
        access_token: "eyJhbGciOiJIUzI1NiJ9.aaa.bbb",
        refresh_token: "refresh-secret",
        user: { id: "74914617-ced2-4b89-b3b9-c622cf056bd2" },
      }),
      "https://djangucecsphnejplvic.supabase.co/auth/v1/token?grant_type=password",
    );
    assert.equal(summary.kind, "auth_token_json");
    assert.equal(summary.hasAccessToken, true);
    assert.equal(summary.userId, "74914617-ced2-4b89-b3b9-c622cf056bd2");
    assert.equal(JSON.stringify(summary).includes("eyJ"), false);
  });

  it("flags wrong host vs official project", () => {
    const evidence = buildAuthNet003Evidence([
      {
        phase: "post_submit",
        method: "POST",
        url: "https://other.supabase.co/auth/v1/token?grant_type=password",
        host: "other.supabase.co",
        isAuthToken: true,
        isSupabase: true,
        status: 200,
        ok: true,
        failure: null,
        responseSummary: { kind: "auth_token_json", hasAccessToken: true },
      },
    ]);
    assert.deepEqual(evidence.wrongHost, ["other.supabase.co"]);
    assert.equal(evidence.diagnosis.callsOfficialHost, false);
    assert.match(formatAuthNet003Report(evidence), /differ from official/);
  });

  it("diagnoses Playwright net failure on official host", () => {
    const evidence = buildAuthNet003Evidence([
      {
        phase: "post_submit",
        method: "POST",
        url: "https://djangucecsphnejplvic.supabase.co/auth/v1/token?grant_type=password",
        host: "djangucecsphnejplvic.supabase.co",
        isAuthToken: true,
        isSupabase: true,
        status: null,
        ok: false,
        failure: { errorText: "net::ERR_FAILED" },
        responseSummary: null,
      },
    ]);
    assert.equal(evidence.diagnosis.playwrightAuthTokenFailed, true);
    assert.equal(evidence.diagnosis.callsOfficialHost, true);
    assert.match(evidence.diagnosis.note, /net::ERR_FAILED/);
  });

  it("notes HTTP 200 in Playwright", () => {
    const evidence = buildAuthNet003Evidence([
      {
        phase: "post_submit",
        method: "POST",
        url: "https://djangucecsphnejplvic.supabase.co/auth/v1/token?grant_type=password",
        host: "djangucecsphnejplvic.supabase.co",
        isAuthToken: true,
        isSupabase: true,
        status: 200,
        ok: true,
        failure: null,
        responseSummary: { kind: "auth_token_json", hasAccessToken: true },
      },
    ]);
    assert.equal(evidence.diagnosis.playwrightAuthToken200, true);
    assert.match(evidence.diagnosis.note, /HTTP 200/);
  });
});
