/** URL normalize helpers for DOM ↔ ledger ↔ performance compares. */

export function normalizeResourceUrl(raw: string): string {
  if (!raw) return "";
  try {
    const u = new URL(raw, typeof document !== "undefined" ? document.baseURI : "https://localhost/");
    // Drop hash; keep search (cache busters can matter). Lowercase host only.
    u.hash = "";
    u.hostname = u.hostname.toLowerCase();
    return u.href;
  } catch {
    return raw.trim();
  }
}

export function urlsRoughlyEqual(a: string, b: string): boolean {
  return normalizeResourceUrl(a) === normalizeResourceUrl(b);
}

export function domUrlSet(domImages: { currentSrc: string; src: string }[]): Set<string> {
  const set = new Set<string>();
  for (const img of domImages) {
    if (img.currentSrc) set.add(normalizeResourceUrl(img.currentSrc));
    if (img.src) set.add(normalizeResourceUrl(img.src));
  }
  return set;
}

export function ageMsFromIso(iso: string | null | undefined, now: number): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return Math.max(0, now - t);
}
