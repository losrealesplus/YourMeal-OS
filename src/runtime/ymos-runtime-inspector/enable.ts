/**
 * YMOS Runtime Inspector / Suite — enable gates (observe-only).
 *
 * Active when ANY of (unless explicitly dismissed this session):
 * - VITE_YMOS_RUNTIME_OVERLAY=true
 * - ?debug-runtime=1 (persists to sessionStorage)
 * - localStorage / sessionStorage ymos.runtime-inspector=1
 * - long-press (800ms) bottom-right corner toggle (client only)
 * - YMOS Horus → ymos-runtime-toggle (RUNTIME-SUITE-001)
 *
 * RUNTIME-SUITE-001: sessionStorage "0" is an explicit dismiss that overrides
 * env force-on for the rest of the session (so ✕ / ESC / Horus toggle can close).
 */

import { ymosTrace } from "../ymos-trace";

const STORAGE_KEY = "ymos.runtime-inspector";
const QUERY_FLAG = "debug-runtime";

/** Emitted exactly once when Suite transitions open → closed (RUNTIME-SUITE-001). */
export const YMOS_RUNTIME_CLOSE_EVENT = "ymos-runtime-close";

function readFlag(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const s = String(value).trim().toLowerCase();
  if (s === "true" || s === "1" || s === "yes" || s === "on") return true;
  if (s === "false" || s === "0" || s === "no" || s === "off") return false;
  return undefined;
}

function envEnabled(): boolean {
  try {
    const v = readFlag(import.meta.env.VITE_YMOS_RUNTIME_OVERLAY);
    if (v !== undefined) return v;
  } catch {
    /* ignore */
  }
  if (typeof process !== "undefined") {
    const v = readFlag(process.env?.VITE_YMOS_RUNTIME_OVERLAY);
    if (v !== undefined) return v;
  }
  return false;
}

/** Explicit session dismiss (RUNTIME-SUITE-001) overrides env / local on. */
function sessionExplicitOff(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return readFlag(window.sessionStorage.getItem(STORAGE_KEY)) === false;
  } catch {
    return false;
  }
}

function storageEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (readFlag(window.sessionStorage.getItem(STORAGE_KEY))) return true;
    if (readFlag(window.localStorage.getItem(STORAGE_KEY))) return true;
  } catch {
    /* private mode */
  }
  return false;
}

function applyQueryParam(): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    const raw = url.searchParams.get(QUERY_FLAG);
    if (raw === null) return;
    const on = (readFlag(raw) ?? (raw === "" || raw === "1")) === true;
    if (on) {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } else {
      window.sessionStorage.setItem(STORAGE_KEY, "0");
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

/** Snapshot whether the overlay should mount (call on client). */
export function isYmosRuntimeInspectorEnabled(): boolean {
  if (typeof window === "undefined") {
    ymosTrace("isEnabled: window undefined → false");
    return false;
  }
  applyQueryParam();

  let envRaw: unknown;
  try {
    envRaw = import.meta.env.VITE_YMOS_RUNTIME_OVERLAY;
  } catch {
    envRaw = "(unavailable)";
  }
  const env = envEnabled();

  let queryRaw: string | null = null;
  try {
    queryRaw = new URL(window.location.href).searchParams.get(QUERY_FLAG);
  } catch {
    queryRaw = null;
  }

  let sessionRaw: string | null = null;
  let localRaw: string | null = null;
  try {
    sessionRaw = window.sessionStorage.getItem(STORAGE_KEY);
    localRaw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    /* private mode */
  }

  const dismissed = sessionExplicitOff();
  const storage = storageEnabled();
  const result = dismissed ? false : env || storage;

  ymosTrace("env", envRaw, "→", env);
  ymosTrace("query", queryRaw);
  ymosTrace("sessionStorage", sessionRaw);
  ymosTrace("localStorage", localRaw);
  ymosTrace("isEnabled result =", result, { env, storage, dismissed });
  return result;
}

/**
 * Open / close the Runtime Suite.
 * Close path sets sessionStorage "0" (explicit dismiss) and emits ymos-runtime-close once.
 */
export function setYmosRuntimeInspectorEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  const wasEnabled = isYmosRuntimeInspectorEnabled();
  try {
    if (on) {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } else {
      // Explicit dismiss — overrides VITE_YMOS_RUNTIME_OVERLAY for this session.
      window.sessionStorage.setItem(STORAGE_KEY, "0");
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("ymos-runtime-inspector-toggle"));
  if (!on && wasEnabled) {
    window.dispatchEvent(new CustomEvent(YMOS_RUNTIME_CLOSE_EVENT));
  }
}

/**
 * Invisible long-press hit target in the bottom-right corner to toggle overlay
 * without touching brand/logo components.
 */
export function installYmosRuntimeInspectorGestureToggle(): () => void {
  if (typeof window === "undefined") return () => {};

  let timer: ReturnType<typeof setTimeout> | null = null;
  const ZONE = 56;

  const clear = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const inZone = (x: number, y: number) =>
    x >= window.innerWidth - ZONE && y >= window.innerHeight - ZONE;

  const onStart = (x: number, y: number) => {
    if (!inZone(x, y)) return;
    clear();
    timer = setTimeout(() => {
      setYmosRuntimeInspectorEnabled(!isYmosRuntimeInspectorEnabled());
    }, 800);
  };

  const onPointerDown = (e: PointerEvent) => onStart(e.clientX, e.clientY);
  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    if (t) onStart(t.clientX, t.clientY);
  };

  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointerup", clear);
  window.addEventListener("pointercancel", clear);
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchend", clear);
  window.addEventListener("touchcancel", clear);

  return () => {
    clear();
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointerup", clear);
    window.removeEventListener("pointercancel", clear);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchend", clear);
    window.removeEventListener("touchcancel", clear);
  };
}
