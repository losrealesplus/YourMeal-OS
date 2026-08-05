/**
 * Developer Portal — discovery / audit events (no passphrase text).
 */

export const YMOS_DEVELOPER_PORTAL_DISCOVER_EVENT =
  "ymos-developer-portal-discover";

export const DEVELOPER_PORTAL_OPENED_EVENT = "developer-portal-opened";

export type DeveloperPortalOpenedDetail = {
  timestamp: string;
  platform: string;
  build: string;
  /** Passphrase catalog id only — never the typed phrase. */
  passphraseId: string;
};

/** Triple-tap discovery — opens the portal modal (host listens). */
export function requestDeveloperPortal(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(YMOS_DEVELOPER_PORTAL_DISCOVER_EVENT));
}

export function emitDeveloperPortalOpened(
  detail: DeveloperPortalOpenedDetail,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(DEVELOPER_PORTAL_OPENED_EVENT, { detail }),
  );
}

export function resolveBuildLabel(): string {
  try {
    const v =
      import.meta.env?.VITE_APP_VERSION ??
      import.meta.env?.VITE_BUILD_ID ??
      import.meta.env?.MODE ??
      "dev";
    return String(v);
  } catch {
    return "unknown";
  }
}
