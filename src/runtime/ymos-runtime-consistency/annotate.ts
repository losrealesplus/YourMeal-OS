/**
 * Annotate ledger entries with LIVE / HISTORICAL / ORPHAN / STALE / UNKNOWN
 * relative to document.images (and age).
 */
import type { YmosAssetAuditSnapshot } from "../ymos-runtime-assets/types";
import type { YmosDomImageRow } from "../ymos-runtime-inspector/dom-images";
import { ageMsFromIso, domUrlSet, normalizeResourceUrl } from "./normalize";
import type { AnnotatedAssetEntry, ConsistencyLifecycle } from "./types";

const STALE_LOADING_MS = 8_000;

export function annotateLedgerEntries(
  ledger: YmosAssetAuditSnapshot,
  domImages: YmosDomImageRow[],
  now: number,
): AnnotatedAssetEntry[] {
  const live = domUrlSet(domImages);

  return ledger.entries.map((entry) => {
    const urlKey = normalizeResourceUrl(entry.url);
    const inDom = live.has(urlKey);
    const ageMs = ageMsFromIso(entry.finishedAt ?? entry.startedAt, now);

    let lifecycle: ConsistencyLifecycle = "UNKNOWN";
    let lifecycleReason = "Unclassified.";

    if (entry.kind === "image" || entry.source === "img") {
      if (inDom) {
        lifecycle = "LIVE";
        lifecycleReason = "URL present in document.images.";
      } else if (entry.status === "error" || entry.status === "ok") {
        lifecycle = "HISTORICAL";
        lifecycleReason =
          "Image URL no longer exists in document.images — retained by asset ledger.";
      } else if (entry.status === "loading") {
        lifecycle = ageMs != null && ageMs > STALE_LOADING_MS ? "STALE" : "UNKNOWN";
        lifecycleReason =
          lifecycle === "STALE"
            ? `Loading longer than ${STALE_LOADING_MS}ms and absent from DOM.`
            : "Loading and not yet seen in DOM.";
      }
    } else {
      // Network / script / css etc. are not expected to be in document.images.
      if (entry.status === "loading" && ageMs != null && ageMs > STALE_LOADING_MS) {
        lifecycle = "STALE";
        lifecycleReason = `Non-image entry still loading after ${STALE_LOADING_MS}ms.`;
      } else {
        lifecycle = "LIVE";
        lifecycleReason = "Non-image ledger observation (not DOM-scoped).";
      }
    }

    // Orphan firstFailure pointer handled at report level; mark entry if id missing from set later.
    return { ...entry, lifecycle, lifecycleReason, ageMs };
  });
}

export function classifyFirstFailure(
  ledger: YmosAssetAuditSnapshot,
  annotated: AnnotatedAssetEntry[],
): { lifecycle: ConsistencyLifecycle | null; reason: string | null } {
  const ff = ledger.firstFailure;
  if (!ff) return { lifecycle: null, reason: null };

  const row = annotated.find((e) => e.id === ff.id);
  if (!row) {
    return {
      lifecycle: "ORPHAN",
      reason: "firstFailureId does not resolve to an entry still in the ledger (trimmed/orphan).",
    };
  }
  if (row.lifecycle === "HISTORICAL" || row.lifecycle === "STALE") {
    return {
      lifecycle: row.lifecycle,
      reason: row.lifecycleReason,
    };
  }
  if (row.kind === "image" || row.source === "img") {
    if (row.lifecycle === "LIVE" && row.status === "error") {
      return { lifecycle: "LIVE", reason: "First failure still present in DOM as a broken image." };
    }
  }
  return { lifecycle: row.lifecycle, reason: row.lifecycleReason };
}
