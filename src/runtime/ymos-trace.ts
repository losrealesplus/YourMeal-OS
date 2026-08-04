/**
 * YMOS Trace — dual sink for Android / WebView diagnostics.
 *
 * Every event:
 * 1. console.log("[YMOS-TRACE] …")  — for adb logcat
 * 2. push to window.__YMOS_TRACE__ — for WebView DevTools inspection
 *
 * Inspect in DevTools:
 *   window.__YMOS_TRACE__
 *   window.__YMOS_TRACE__.at(-1)
 *   copy(JSON.stringify(window.__YMOS_TRACE__, null, 2))
 */

const MAX_ENTRIES = 500;
const FLAG = "__YMOS_TRACE__";

export type YmosTraceEntry = {
  t: string;
  msg: string;
  args: unknown[];
};

declare global {
  interface Window {
    [FLAG]?: YmosTraceEntry[];
    __YMOS_TRACE_DUMP__?: () => string;
  }
}

function ensureBuffer(): YmosTraceEntry[] {
  if (typeof window === "undefined") return [];
  if (!window[FLAG]) {
    window[FLAG] = [];
    window.__YMOS_TRACE_DUMP__ = () =>
      JSON.stringify(window[FLAG] ?? [], null, 2);
  }
  return window[FLAG]!;
}

/**
 * Record a diagnostic event. Safe on SSR (console only / no-op buffer).
 */
export function ymosTrace(msg: string, ...args: unknown[]): void {
  const line = `[YMOS-TRACE] ${msg}`;
  if (args.length > 0) {
    console.log(line, ...args);
  } else {
    console.log(line);
  }

  if (typeof window === "undefined") return;

  const buf = ensureBuffer();
  buf.push({
    t: new Date().toISOString(),
    msg,
    args: args.map((a) => {
      try {
        return JSON.parse(JSON.stringify(a));
      } catch {
        return String(a);
      }
    }),
  });
  while (buf.length > MAX_ENTRIES) buf.shift();
}

/** Read-only snapshot of the in-memory trace (empty on SSR). */
export function getYmosTrace(): readonly YmosTraceEntry[] {
  if (typeof window === "undefined") return [];
  return ensureBuffer().slice();
}
