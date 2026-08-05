/**
 * Developer Portal — passphrase catalog (architecture for future commands).
 * Never persist phrases. Match is case-insensitive + trim.
 */

export type PassphraseAction = "runtime-toggle";

export type PassphraseEntry = {
  /** Audit id — never the typed phrase (e.g. HORUS). */
  id: string;
  /** Normalized key: lowercase phrase. */
  phrase: string;
  action: PassphraseAction;
};

/**
 * Official catalog. Only HORUS is wired in DEVELOPER-PORTAL-001.
 * Future rows are reserved for architecture — do not implement handlers yet.
 */
export const PASSPHRASE_CATALOG: readonly PassphraseEntry[] = [
  {
    id: "HORUS",
    phrase: "ymos horus",
    action: "runtime-toggle",
  },
  // Future (architecture only — not implemented):
  // { id: "DOCTOR", phrase: "ymos doctor", action: "…" },
  // { id: "ASSETS", phrase: "ymos assets", action: "…" },
  // { id: "NETWORK", phrase: "ymos network", action: "…" },
  // { id: "PERFORMANCE", phrase: "ymos performance", action: "…" },
];

export function normalizePassphrase(input: string): string {
  return input.trim().toLowerCase();
}

export function matchPassphrase(input: string): PassphraseEntry | null {
  const normalized = normalizePassphrase(input);
  if (!normalized) return null;
  return PASSPHRASE_CATALOG.find((e) => e.phrase === normalized) ?? null;
}
