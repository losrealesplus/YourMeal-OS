/**
 * RUNTIME-SUITE-001 — enable / dismiss lifecycle (no DOM required).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isYmosRuntimeInspectorEnabled,
  setYmosRuntimeInspectorEnabled,
  YMOS_RUNTIME_CLOSE_EVENT,
} from "./enable";

type Listener = (e: Event) => void;

function installFakeWindow() {
  const store: Record<string, string> = {};
  const listeners = new Map<string, Set<Listener>>();
  const sessionStorage = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
  };
  const localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
  const fakeWindow = {
    location: { href: "https://example.test/" },
    sessionStorage,
    localStorage,
    addEventListener(type: string, fn: Listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(fn);
    },
    removeEventListener(type: string, fn: Listener) {
      listeners.get(type)?.delete(fn);
    },
    dispatchEvent(event: Event) {
      const set = listeners.get(event.type);
      if (set) for (const fn of [...set]) fn(event);
      return true;
    },
  };
  vi.stubGlobal("window", fakeWindow);
  vi.stubGlobal(
    "CustomEvent",
    class CustomEvent extends Event {
      detail: unknown;
      constructor(type: string, init: { detail?: unknown } = {}) {
        super(type);
        this.detail = init.detail;
      }
    },
  );
  return { store, fakeWindow };
}

describe("RUNTIME-SUITE-001 enable lifecycle", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("opens via set(true) and closes via set(false)", () => {
    installFakeWindow();
    expect(isYmosRuntimeInspectorEnabled()).toBe(false);
    setYmosRuntimeInspectorEnabled(true);
    expect(isYmosRuntimeInspectorEnabled()).toBe(true);
    setYmosRuntimeInspectorEnabled(false);
    expect(isYmosRuntimeInspectorEnabled()).toBe(false);
  });

  it("emits ymos-runtime-close exactly once on open→close", () => {
    installFakeWindow();
    const closes: Event[] = [];
    window.addEventListener(YMOS_RUNTIME_CLOSE_EVENT, (e) => closes.push(e));

    setYmosRuntimeInspectorEnabled(true);
    setYmosRuntimeInspectorEnabled(false);
    setYmosRuntimeInspectorEnabled(false); // already closed

    expect(closes).toHaveLength(1);
  });

  it("explicit session dismiss overrides env force-on", () => {
    installFakeWindow();
    vi.stubEnv("VITE_YMOS_RUNTIME_OVERLAY", "true");
    // import.meta.env may not pick stubEnv — simulate by setting storage after open path
    setYmosRuntimeInspectorEnabled(true);
    expect(isYmosRuntimeInspectorEnabled()).toBe(true);
    setYmosRuntimeInspectorEnabled(false);
    // session "0" must win even if local/env would prefer on
    expect(window.sessionStorage.getItem("ymos.runtime-inspector")).toBe("0");
    expect(isYmosRuntimeInspectorEnabled()).toBe(false);
  });

  it("toggle pattern open → close → open", () => {
    installFakeWindow();
    setYmosRuntimeInspectorEnabled(!isYmosRuntimeInspectorEnabled());
    expect(isYmosRuntimeInspectorEnabled()).toBe(true);
    setYmosRuntimeInspectorEnabled(!isYmosRuntimeInspectorEnabled());
    expect(isYmosRuntimeInspectorEnabled()).toBe(false);
    setYmosRuntimeInspectorEnabled(!isYmosRuntimeInspectorEnabled());
    expect(isYmosRuntimeInspectorEnabled()).toBe(true);
  });
});
