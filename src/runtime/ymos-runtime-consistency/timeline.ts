/** Best-effort consistency timeline derived from ledger + DOM annotations. */
import type { AnnotatedAssetEntry, ConsistencyLifecycle, ConsistencyTimelineEvent } from "./types";
import type { YmosDomImageRow } from "../ymos-runtime-inspector/dom-images";

function fmtAge(ageMs: number | null): string {
  if (ageMs == null) return "unknown age";
  if (ageMs < 1000) return `${ageMs}ms ago`;
  return `${Math.round(ageMs / 1000)}s ago`;
}

export function buildConsistencyTimeline(input: {
  annotated: AnnotatedAssetEntry[];
  domImages: YmosDomImageRow[];
  firstFailureLifecycle: ConsistencyLifecycle | null;
  firstFailureReason: string | null;
  firstFailureUrl: string | null;
}): ConsistencyTimelineEvent[] {
  const events: ConsistencyTimelineEvent[] = [];

  const historicalImages = input.annotated
    .filter((e) => (e.kind === "image" || e.source === "img") && e.lifecycle === "HISTORICAL")
    .slice()
    .sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));

  for (const e of historicalImages.slice(-5)) {
    events.push({
      at: e.finishedAt ?? e.startedAt,
      label: e.status === "error" ? "Image failed (ledger)" : "Image observed (ledger)",
      detail: `${e.url} · ${e.lifecycle} · ${fmtAge(e.ageMs)} · ${e.error ?? e.status}`,
    });
  }

  for (const img of input.domImages) {
    const src = img.currentSrc || img.src;
    if (!src) continue;
    events.push({
      at: new Date().toISOString(),
      label: "DOM image present",
      detail: `${src} · natural ${img.naturalWidth}×${img.naturalHeight} · ownerHint=${img.ownerHint}`,
    });
  }

  if (input.firstFailureUrl && input.firstFailureLifecycle) {
    events.push({
      at: new Date().toISOString(),
      label:
        input.firstFailureLifecycle === "LIVE"
          ? "FirstFailure is LIVE"
          : "FirstFailure is not current",
      detail: `${input.firstFailureUrl} · ${input.firstFailureLifecycle} · ${input.firstFailureReason ?? ""}`,
    });
  }

  return events.slice(-12);
}
