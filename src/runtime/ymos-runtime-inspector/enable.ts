/**
 * YMOS Runtime Inspector — enable gates (observe-only).
 *
 * Active when ANY of:
 * - VITE_YMOS_RUNTIME_OVERLAY=true
 * - ?debug-runtime=1 (persists to sessionStorage)
 * - localStorage / sessionStorage ymos.runtime-inspector=1
 * - long-press (800ms) bottom-right corner toggle (client only)
 */

const STORAGE_KEY = "ymos.runtime-inspector";
const QUERY_FLAG = "debug-runtime";

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

function storageEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (readFlag(sessionStorage.getItem(STORAGE_KEY))) return true;
    if (readFlag(localStorage.getItem(STORAGE_KEY))) return true;
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
      sessionStorage.setItem(STORAGE_KEY, "1");
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

/** Snapshot whether the overlay should mount (call on client). */
export function isYmosRuntimeInspectorEnabled(): boolean {
  if (typeof window === "undefined") return false;
  applyQueryParam();
  return envEnabled() || storageEnabled();
}

export function setYmosRuntimeInspectorEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (on) sessionStorage.setItem(STORAGE_KEY, "1");
    else {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("ymos-runtime-inspector-toggle"));
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
