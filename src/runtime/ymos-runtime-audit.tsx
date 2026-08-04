/**
 * ANDROID-RUNTIME-001 — observe-only startup sensors.
 * Prefixed `[YMOS-RUNTIME]` for: adb logcat | grep YMOS-RUNTIME
 *
 * Does not change app behavior, state, providers, routes, or i18n.
 */
import { useEffect, type ReactNode } from "react";

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
  ymosRuntimeLog("main.tsx START");
}

export function installYmosRuntimeErrorTraps(): void {
  if (typeof window === "undefined") return;
  if (window[ERROR_TRAPS]) return;
  window[ERROR_TRAPS] = true;

  window.addEventListener("error", (event) => {
    ymosRuntimeLog(
      `uncaught error message=${event.message} file=${event.filename}:${event.lineno}`,
    );
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const text =
      reason instanceof Error
        ? `${reason.name}: ${reason.message}`
        : String(reason);
    ymosRuntimeLog(`unhandledrejection ${text}`);
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
    if (children == null) {
      ymosRuntimeLog(`${label} (children=null)`);
    } else {
      ymosRuntimeLog(label);
    }
  }, [label, children]);

  return <>{children}</>;
}
