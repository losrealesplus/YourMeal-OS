import { describe, expect, it } from "vitest";
import { runRuntimeConsistencyEngine, buildConsistencyContext } from "./engine";
import type { YmosAssetAuditSnapshot } from "../ymos-runtime-assets/types";
import type { YmosDomImageRow } from "../ymos-runtime-inspector/dom-images";

function snap(partial: Partial<YmosAssetAuditSnapshot> & { entries: YmosAssetAuditSnapshot["entries"] }): YmosAssetAuditSnapshot {
  return {
    env: {
      href: "https://localhost/",
      origin: "https://localhost",
      pathname: "/",
      baseURI: "https://localhost/",
      baseUrl: "/",
      readyState: "complete",
    },
    firstFailure: null,
    counts: {
      total: partial.entries.length,
      ok: partial.entries.filter((e) => e.status === "ok").length,
      error: partial.entries.filter((e) => e.status === "error").length,
      loading: partial.entries.filter((e) => e.status === "loading").length,
    },
    ...partial,
  };
}

describe("RuntimeConsistencyEngine", () => {
  it("flags sticky firstFailure absent from DOM as ERROR / HISTORICAL", () => {
    const ghost = {
      id: "asset-17",
      url: "https://localhost/__l5e/assets-v1/x/eatclean-logo.png",
      kind: "image" as const,
      source: "img" as const,
      status: "error" as const,
      httpStatus: null,
      error: "img load error",
      startedAt: new Date(Date.now() - 30_000).toISOString(),
      finishedAt: new Date(Date.now() - 29_000).toISOString(),
      durationMs: 1000,
    };
    const liveLogo = {
      id: "asset-99",
      url: "https://localhost/assets/logo-abc.png",
      kind: "image" as const,
      source: "img" as const,
      status: "ok" as const,
      httpStatus: null,
      error: null,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 10,
    };
    const ledger = snap({
      entries: [ghost, liveLogo],
      firstFailure: ghost,
    });
    const domImages: YmosDomImageRow[] = [
      {
        index: 0,
        currentSrc: "https://localhost/assets/logo-abc.png",
        src: "https://localhost/assets/logo-abc.png",
        alt: "EatClean — test",
        width: 120,
        height: 48,
        complete: true,
        naturalWidth: 240,
        naturalHeight: 96,
        className: "",
        id: "",
        ownerHint: "TenantLogo",
      },
    ];

    const report = runRuntimeConsistencyEngine(
      buildConsistencyContext({
        domImages,
        ledger,
        route: "/auth",
        now: Date.now(),
      }),
    );

    expect(report.firstFailureLifecycle).toBe("HISTORICAL");
    const alive = report.results.find((r) => r.ruleId === "assertFirstFailureAlive");
    expect(alive?.severity).toBe("error");
    const historical = report.results.find((r) => r.ruleId === "assertNoHistoricalAssets");
    expect(historical?.severity).toBe("error");
    const logo = report.results.find((r) => r.ruleId === "assertSameImage");
    expect(logo?.severity).toBe("ok");
  });
});
