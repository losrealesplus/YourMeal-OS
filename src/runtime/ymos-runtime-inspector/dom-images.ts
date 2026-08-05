/**
 * ANDROID-DOM-001 — observe-only snapshot of document.images (WebView truth).
 * Pure read of the live DOM. Does not mutate nodes or app state.
 */

export type YmosDomImageOwnerHint =
  | "TenantLogo"
  | "hero"
  | "favicon"
  | "inspector"
  | "unknown";

export type YmosDomImageRow = {
  index: number;
  currentSrc: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  complete: boolean;
  naturalWidth: number;
  naturalHeight: number;
  className: string;
  id: string;
  /** Best-effort inference from alt / src / class — not React fiber. */
  ownerHint: YmosDomImageOwnerHint;
};

function inferOwner(img: HTMLImageElement): YmosDomImageOwnerHint {
  const alt = (img.alt || "").toLowerCase();
  const src = (img.currentSrc || img.src || "").toLowerCase();
  const cls = (img.className || "").toLowerCase();
  const id = (img.id || "").toLowerCase();

  if (
    id.includes("ymos-runtime") ||
    cls.includes("ymos-runtime") ||
    src.includes("ymos-runtime")
  ) {
    return "inspector";
  }
  if (alt.includes("eatclean") || alt.includes("yourmeal") || alt.includes("logo")) {
    return "TenantLogo";
  }
  if (src.includes("hero") || src.includes("splash") || alt.includes("hero")) {
    return "hero";
  }
  if (src.includes("favicon") || src.endsWith(".ico")) {
    return "favicon";
  }
  return "unknown";
}

/** Snapshot every HTMLImageElement currently in document.images. */
export function collectDomImages(): YmosDomImageRow[] {
  if (typeof document === "undefined") return [];

  return Array.from(document.images).map((img, index) => ({
    index,
    currentSrc: img.currentSrc || "",
    src: img.src || "",
    alt: img.alt || "",
    width: img.width,
    height: img.height,
    complete: img.complete,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    className: typeof img.className === "string" ? img.className : "",
    id: img.id || "",
    ownerHint: inferOwner(img),
  }));
}
