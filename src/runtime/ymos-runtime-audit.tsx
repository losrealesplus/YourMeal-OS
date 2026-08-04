/**
 * ANDROID-RUNTIME-001 — observe-only startup sensors.
 * Prefixed `[YMOS-RUNTIME]` for: adb logcat | grep YMOS-RUNTIME
 *
 * Feeds YMOS Runtime Inspector status registry (ANDROID-RUNTIME-002).
 * Does not change app behavior, state, providers, routes, or i18n.
 */
import { useEffect, type ReactNode } from "react";
import {
  markYmosRuntimeMainStarted,
  markYmosRuntimeMountFromLabel,
  recordYmosRuntimeException,
} from "./ymos-runtime-status";

const ERROR_TRAPS = "__YMOS_RUNTIME_ERROR_TRAPS__";

declare global {
  interface Window {
    [ERROR_TRAPS]?: boolean;
  }
}

export function ymosRuntimeLog(message: string, detail?: unknown): void {
  if (detail !== undefined) {
    console.log(`[YMOS-RUNTIME] ${message}`, detail);
  } else {
    console.log(`[YMOS-RUNTIME] ${message}`);
  }
}

/** One-shot client entry marker (conceptual main.tsx — TanStack Start has no main.tsx). */
export function logYmosRuntimeMainStart(): void {
  if (typeof window === "undefined") return;
  markYmosRuntimeMainStarted();
  ymosRuntimeLog("main.tsx START");
}

export function installYmosRuntimeErrorTraps(): void {
  if (typeof window === "undefined") return;
  if (window[ERROR_TRAPS]) return;
  window[ERROR_TRAPS] = true;

  window.addEventListener("error", (event) => {
    const msg = `uncaught error message=${event.message} file=${event.filename}:${event.lineno}`;
    recordYmosRuntimeException(msg);
    ymosRuntimeLog(msg);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const text =
      reason instanceof Error
        ? `${reason.name}: ${reason.message}`
        : String(reason);
    const msg = `unhandledrejection ${text}`;
    recordYmosRuntimeException(msg);
    ymosRuntimeLog(msg);
  });
}

/**
 * Logs once after mount. Pure observation — renders children unchanged.
 * If this never appears, a parent failed or returned null / non-child UI.
 */
export function YmosRuntimeMountProbe({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  useEffect(() => {
    markYmosRuntimeMountFromLabel(label);
    if (children == null) {
      ymosRuntimeLog(`${label} (children=null)`);
    } else {
      ymosRuntimeLog(label);
    }
  }, [label, children]);

  return <>{children}</>;
}
