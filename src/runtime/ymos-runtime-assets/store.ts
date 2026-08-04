/**
 * ANDROID-ASSETS-001 — in-memory asset resolution ledger (observe-only).
 */
import type {
  YmosAssetEntry,
  YmosAssetEnv,
  YmosAssetAuditSnapshot,
  YmosAssetKind,
  YmosAssetStatus,
} from "./types";

const MAX_ENTRIES = 120;
const FLAG = "__YMOS_ASSET_AUDIT__";

type Listener = () => void;

type Store = {
  entries: YmosAssetEntry[];
  byUrl: Map<string, string>;
  firstFailureId: string | null;
  seq: number;
};

declare global {
  interface Window {
    [FLAG]?: boolean;
  }
}

const store: Store = {
  entries: [],
  byUrl: new Map(),
  firstFailureId: null,
  seq: 0,
};

const listeners = new Set<Listener>();

/**
 * REACT-185 FIX-001 — Cached getSnapshot for useSyncExternalStore.
 * React requires: while the store is unchanged, getSnapshot must return the
 * same value by Object.is. Building a fresh object every call causes an
 * infinite re-render loop (minified React error #185).
 */
let cachedSnapshot: YmosAssetAuditSnapshot | null = null;

function notify() {
  cachedSnapshot = null;
  for (const l of listeners) l();
}

export function subscribeYmosAssetAudit(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function classifyAssetUrl(url: string): YmosAssetKind {
  const u = url.toLowerCase().split("?")[0] ?? url.toLowerCase();
  if (u.includes("favicon")) return "favicon";
  if (/\.(png|jpe?g|gif|webp|svg|ico|avif)(\b|$)/.test(u) || u.includes("/logo"))
    return "image";
  if (/\.(css)(\b|$)/.test(u)) return "css";
  if (/\.(js|mjs|cjs)(\b|$)/.test(u)) return "js";
  if (/\.(woff2?|ttf|otf|eot)(\b|$)/.test(u)) return "font";
  if (/\.(html?)(\b|$)/.test(u)) return "html";
  return "other";
}

function nextId(): string {
  store.seq += 1;
  return `asset-${store.seq}`;
}

function trim() {
  while (store.entries.length > MAX_ENTRIES) {
    const removed = store.entries.shift();
    if (removed) store.byUrl.delete(removed.url);
  }
}

export function recordYmosAssetStart(input: {
  url: string;
  kind?: YmosAssetKind;
  source: YmosAssetEntry["source"];
}): string {
  const existingId = store.byUrl.get(input.url);
  if (existingId) {
    const existing = store.entries.find((e) => e.id === existingId);
    if (existing && existing.status === "loading") return existingId;
  }

  const id = nextId();
  const entry: YmosAssetEntry = {
    id,
    url: input.url,
    kind: input.kind ?? classifyAssetUrl(input.url),
    source: input.source,
    status: "loading",
    httpStatus: null,
    error: null,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    durationMs: null,
  };
  store.entries.push(entry);
  store.byUrl.set(input.url, id);
  trim();
  notify();
  return id;
}

export function recordYmosAssetFinish(
  idOrUrl: string,
  result: {
    status: YmosAssetStatus;
    httpStatus?: number | null;
    error?: string | null;
    kind?: YmosAssetKind;
  },
): void {
  let entry =
    store.entries.find((e) => e.id === idOrUrl) ??
    store.entries.find((e) => e.url === idOrUrl);

  if (!entry) {
    const id = recordYmosAssetStart({
      url: idOrUrl,
      kind: result.kind,
      source: "performance",
    });
    entry = store.entries.find((e) => e.id === id)!;
  }

  const started = Date.parse(entry.startedAt);
  entry.status = result.status;
  entry.httpStatus = result.httpStatus ?? entry.httpStatus;
  entry.error = result.error ?? entry.error;
  if (result.kind) entry.kind = result.kind;
  entry.finishedAt = new Date().toISOString();
  entry.durationMs = Number.isFinite(started)
    ? Math.max(0, Date.now() - started)
    : null;

  if (result.status === "error" && !store.firstFailureId) {
    store.firstFailureId = entry.id;
  }
  notify();
}

export function readYmosAssetEnv(): YmosAssetEnv {
  if (typeof window === "undefined") {
    return {
      href: "",
      origin: "",
      pathname: "",
      baseURI: "",
      baseUrl: "",
      readyState: "",
    };
  }
  let baseUrl = "/";
  try {
    baseUrl = String(import.meta.env.BASE_URL ?? "/");
  } catch {
    baseUrl = "/";
  }
  return {
    href: window.location.href,
    origin: window.location.origin,
    pathname: window.location.pathname,
    baseURI: document.baseURI,
    baseUrl,
    readyState: document.readyState,
  };
}

export function getYmosAssetAuditSnapshot(): YmosAssetAuditSnapshot {
  if (cachedSnapshot !== null) {
    return cachedSnapshot;
  }

  const entries = store.entries.slice();
  const firstFailure =
    entries.find((e) => e.id === store.firstFailureId) ??
    entries.find((e) => e.status === "error") ??
    null;
  const counts = {
    total: entries.length,
    ok: entries.filter((e) => e.status === "ok").length,
    error: entries.filter((e) => e.status === "error").length,
    loading: entries.filter((e) => e.status === "loading").length,
  };

  cachedSnapshot = {
    env: readYmosAssetEnv(),
    entries,
    firstFailure,
    counts,
  };
  return cachedSnapshot;
}

export function getYmosAssetAuditInstalled(): boolean {
  return typeof window !== "undefined" && Boolean(window[FLAG]);
}

export function markYmosAssetAuditInstalled(): void {
  if (typeof window !== "undefined") window[FLAG] = true;
}
