/**
 * RUNTIME-CONSISTENCY-002 — rule set v1 (assets / DOM / performance / firstFailure).
 */
import { annotateLedgerEntries, classifyFirstFailure } from "./annotate";
import { domUrlSet, normalizeResourceUrl, urlsRoughlyEqual } from "./normalize";
import type {
  ConsistencyResult,
  RuntimeConsistencyContext,
  RuntimeConsistencyRule,
} from "./types";

function ok(ruleId: string, title: string, description: string, evidence?: unknown): ConsistencyResult {
  return { ruleId, severity: "ok", title, description, evidence: evidence ?? null };
}

function warning(ruleId: string, title: string, description: string, evidence?: unknown): ConsistencyResult {
  return { ruleId, severity: "warning", title, description, evidence: evidence ?? null };
}

function error(ruleId: string, title: string, description: string, evidence?: unknown): ConsistencyResult {
  return { ruleId, severity: "error", title, description, evidence: evidence ?? null };
}

export const assertFirstFailureAlive: RuntimeConsistencyRule = {
  id: "assertFirstFailureAlive",
  run(ctx) {
    const ff = ctx.ledger.firstFailure;
    if (!ff) {
      return ok(this.id, "No historical firstFailure", "Ledger has no firstFailure pointer.");
    }
    const annotated = annotateLedgerEntries(ctx.ledger, ctx.domImages, ctx.now);
    const { lifecycle, reason } = classifyFirstFailure(ctx.ledger, annotated);
    if (lifecycle === "LIVE" && ff.status === "error") {
      return ok(this.id, "FirstFailure is LIVE", reason ?? "Failure still present in DOM.", {
        url: ff.url,
        lifecycle,
      });
    }
    if (lifecycle === "ORPHAN") {
      return error(this.id, "Orphan firstFailure", reason ?? "Pointer missing from entries.", {
        url: ff.url,
        lifecycle,
      });
    }
    return error(
      this.id,
      "Stale firstFailure (not current)",
      reason ??
        "FirstFailure references an image absent from document.images — ignore for current diagnostics.",
      { url: ff.url, lifecycle, source: ff.source, error: ff.error },
    );
  },
};

export const assertLedgerMatchesDOM: RuntimeConsistencyRule = {
  id: "assertLedgerMatchesDOM",
  run(ctx) {
    const live = domUrlSet(ctx.domImages);
    const ghostErrors = ctx.ledger.entries.filter((e) => {
      if (!(e.kind === "image" || e.source === "img")) return false;
      if (e.status !== "error") return false;
      return !live.has(normalizeResourceUrl(e.url));
    });
    if (ghostErrors.length === 0) {
      return ok(
        this.id,
        "DOM matches image error ledger",
        "No image errors in the ledger without a matching document.images URL.",
      );
    }
    return warning(
      this.id,
      "Asset ledger references images absent from DOM",
      `${ghostErrors.length} image error(s) are HISTORICAL ghosts (not in document.images).`,
      { urls: ghostErrors.map((e) => e.url).slice(0, 10) },
    );
  },
};

export const assertNoGhostEntries: RuntimeConsistencyRule = {
  id: "assertNoGhostEntries",
  run(ctx) {
    const annotated = annotateLedgerEntries(ctx.ledger, ctx.domImages, ctx.now);
    const ghosts = annotated.filter(
      (e) => (e.kind === "image" || e.source === "img") && e.lifecycle === "HISTORICAL",
    );
    if (ghosts.length === 0) {
      return ok(this.id, "No ghost image entries", "All image ledger rows are LIVE or non-terminal.");
    }
    return warning(
      this.id,
      "Ghost / historical image entries",
      `${ghosts.length} image observation(s) no longer exist in the DOM.`,
      {
        sample: ghosts.slice(0, 5).map((g) => ({
          url: g.url,
          ageMs: g.ageMs,
          status: g.status,
        })),
      },
    );
  },
};

export const assertNoOrphanEntries: RuntimeConsistencyRule = {
  id: "assertNoOrphanFirstFailure",
  run(ctx) {
    const id = ctx.ledger.firstFailure?.id;
    if (!id) {
      return ok(this.id, "No orphan firstFailure", "No firstFailure id to resolve.");
    }
    const found = ctx.ledger.entries.some((e) => e.id === id);
    if (found) {
      return ok(this.id, "firstFailure resolves", "firstFailureId maps to an entry in the ledger.");
    }
    return error(
      this.id,
      "Orphan firstFailureId",
      "firstFailureId does not match any entry (likely FIFO-trimmed).",
      { firstFailureId: id },
    );
  },
};

export const assertNoDuplicateResources: RuntimeConsistencyRule = {
  id: "assertNoDuplicateResources",
  run(ctx) {
    const terminal = ctx.ledger.entries.filter((e) => e.status === "ok" || e.status === "error");
    const byUrl = new Map<string, number>();
    for (const e of terminal) {
      const k = `${normalizeResourceUrl(e.url)}::${e.status}`;
      byUrl.set(k, (byUrl.get(k) ?? 0) + 1);
    }
    const dupes = [...byUrl.entries()].filter(([, n]) => n > 1);
    if (dupes.length === 0) {
      return ok(this.id, "No duplicated terminal resources", "No repeated URL+status pairs.");
    }
    return warning(
      this.id,
      "Duplicated resources in ledger",
      `${dupes.length} URL+status pair(s) appear more than once (append-only ledger).`,
      { sample: dupes.slice(0, 8).map(([k, n]) => ({ key: k, count: n })) },
    );
  },
};

export const assertPerformanceMatchesDOM: RuntimeConsistencyRule = {
  id: "assertPerformanceMatchesDOM",
  run(ctx) {
    if (ctx.performanceNames.length === 0) {
      return warning(
        this.id,
        "Performance buffer empty",
        "No PerformanceResourceTiming names available to compare with DOM images.",
      );
    }
    const perf = new Set(ctx.performanceNames.map(normalizeResourceUrl));
    const missing = ctx.domImages.filter((img) => {
      const u = normalizeResourceUrl(img.currentSrc || img.src);
      if (!u) return false;
      // data: and blob: often absent from resource timing
      if (u.startsWith("data:") || u.startsWith("blob:")) return false;
      return !perf.has(u);
    });
    if (missing.length === 0) {
      return ok(
        this.id,
        "DOM matches Performance",
        "Every document image URL appears in PerformanceResourceTiming names.",
      );
    }
    return warning(
      this.id,
      "DOM image missing from Performance",
      `${missing.length} DOM image(s) have no matching Performance entry (may be cache/timing).`,
      { urls: missing.map((m) => m.currentSrc || m.src).slice(0, 8) },
    );
  },
};

export const assertSnapshotFresh: RuntimeConsistencyRule = {
  id: "assertSnapshotFresh",
  run(ctx) {
    // Snapshot is rebuilt when ledger notifies; we check env href vs location as a freshness proxy.
    const envHref = ctx.ledger.env.href || "";
    const liveHref =
      typeof window !== "undefined" ? window.location.href : "";
    if (!envHref || !liveHref) {
      return warning(this.id, "Snapshot env incomplete", "Ledger env.href or location missing.");
    }
    if (urlsRoughlyEqual(envHref, liveHref)) {
      return ok(this.id, "Snapshot env matches location", "Ledger env.href matches window.location.href.");
    }
    return warning(
      this.id,
      "Stale snapshot env",
      "Ledger env.href differs from window.location.href — snapshot may predate navigation.",
      { envHref, liveHref },
    );
  },
};

export const assertNoHistoricalAssetsAsCurrent: RuntimeConsistencyRule = {
  id: "assertNoHistoricalAssets",
  run(ctx) {
    const annotated = annotateLedgerEntries(ctx.ledger, ctx.domImages, ctx.now);
    const { lifecycle, reason } = classifyFirstFailure(ctx.ledger, annotated);
    if (!lifecycle || lifecycle === "LIVE") {
      return ok(
        this.id,
        "Current diagnostics not polluted",
        "FirstFailure is absent or LIVE — safe to treat as current.",
      );
    }
    return error(
      this.id,
      "Historical asset presented as current",
      `Assets First Failure should be ignored for current UX. ${reason ?? ""}`.trim(),
      { lifecycle, url: ctx.ledger.firstFailure?.url },
    );
  },
};

export const assertSameImageLogo: RuntimeConsistencyRule = {
  id: "assertSameImage",
  run(ctx) {
    const logos = ctx.domImages.filter((i) => i.ownerHint === "TenantLogo");
    if (logos.length === 0) {
      return warning(this.id, "No TenantLogo in DOM", "Could not infer a TenantLogo image to validate.");
    }
    const bad = logos.filter((img) => {
      const u = img.currentSrc || img.src;
      return u.includes("/__l5e/") || !u.includes("/assets/");
    });
    const broken = logos.filter((img) => img.complete && img.naturalWidth === 0);
    if (bad.length === 0 && broken.length === 0) {
      return ok(
        this.id,
        "TenantLogo src is Vite asset",
        "Inferred TenantLogo image(s) use /assets/… and decode successfully.",
        { count: logos.length },
      );
    }
    if (bad.length > 0) {
      return error(
        this.id,
        "TenantLogo src is not a bundled asset",
        "Inferred TenantLogo still points outside /assets/ (possible Lovable virtual path).",
        { urls: bad.map((b) => b.currentSrc || b.src) },
      );
    }
    return error(this.id, "TenantLogo failed to decode", "naturalWidth=0 on complete TenantLogo image(s).", {
      urls: broken.map((b) => b.currentSrc || b.src),
    });
  },
};

export const assertDomCompleteVsLedger: RuntimeConsistencyRule = {
  id: "assertDomCompleteVsLedger",
  run(ctx) {
    const liveOk = ctx.domImages.filter((i) => i.complete && i.naturalWidth > 0);
    const mismatches: { url: string; ledgerStatus: string }[] = [];
    for (const img of liveOk) {
      const u = normalizeResourceUrl(img.currentSrc || img.src);
      const ledgerRows = ctx.ledger.entries.filter(
        (e) => normalizeResourceUrl(e.url) === u && (e.kind === "image" || e.source === "img"),
      );
      const latest = ledgerRows[ledgerRows.length - 1];
      if (latest && (latest.status === "error" || latest.status === "loading")) {
        mismatches.push({ url: img.currentSrc || img.src, ledgerStatus: latest.status });
      }
    }
    if (mismatches.length === 0) {
      return ok(
        this.id,
        "DOM success vs ledger",
        "No LIVE decoded images still marked error/loading in the latest ledger row.",
      );
    }
    return error(
      this.id,
      "Ledger status mismatches DOM",
      "DOM shows decoded images while ledger still says error/loading for the same URL.",
      { mismatches },
    );
  },
};

/** Default rule pack for Consistency Engine v1. */
export const DEFAULT_CONSISTENCY_RULES: RuntimeConsistencyRule[] = [
  assertFirstFailureAlive,
  assertLedgerMatchesDOM,
  assertNoGhostEntries,
  assertNoOrphanEntries,
  assertNoDuplicateResources,
  assertPerformanceMatchesDOM,
  assertSnapshotFresh,
  assertNoHistoricalAssetsAsCurrent,
  assertSameImageLogo,
  assertDomCompleteVsLedger,
];
