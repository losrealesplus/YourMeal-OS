/**
 * ANDROID-ASSETS-001 — Runtime Asset Resolution Audit
 * Observe-only resource resolution ledger for Capacitor / WebView.
 */

export type YmosAssetKind =
  | "js"
  | "css"
  | "image"
  | "font"
  | "favicon"
  | "html"
  | "xhr"
  | "fetch"
  | "import"
  | "other";

export type YmosAssetStatus = "loading" | "ok" | "error";

export type YmosAssetEntry = {
  id: string;
  url: string;
  kind: YmosAssetKind;
  source: "fetch" | "xhr" | "img" | "link" | "script" | "performance" | "import" | "nav";
  status: YmosAssetStatus;
  httpStatus: number | null;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
};

export type YmosAssetEnv = {
  href: string;
  origin: string;
  pathname: string;
  baseURI: string;
  baseUrl: string;
  readyState: string;
};

export type YmosAssetAuditSnapshot = {
  env: YmosAssetEnv;
  entries: YmosAssetEntry[];
  firstFailure: YmosAssetEntry | null;
  counts: { total: number; ok: number; error: number; loading: number };
};
