import { describe, expect, it, vi } from "vitest";
import { createTripleTapDetector, TRIPLE_TAP_WINDOW_MS } from "./triple-tap";
import { matchPassphrase, normalizePassphrase, PASSPHRASE_CATALOG } from "./passphrase";
import {
  DEVELOPER_PORTAL_OPENED_EVENT,
  emitDeveloperPortalOpened,
  requestDeveloperPortal,
  YMOS_DEVELOPER_PORTAL_DISCOVER_EVENT,
} from "./developer-portal-events";

describe("triple-tap", () => {
  it("fires on three taps within the window", () => {
    let now = 0;
    const d = createTripleTapDetector({ now: () => now });
    expect(d.tap()).toBe(false);
    now += 100;
    expect(d.tap()).toBe(false);
    now += 100;
    expect(d.tap()).toBe(true);
    expect(d.count()).toBe(0);
  });

  it("resets when taps are spaced beyond the window", () => {
    let now = 0;
    const d = createTripleTapDetector({ now: () => now });
    expect(d.tap()).toBe(false);
    now += 100;
    expect(d.tap()).toBe(false);
    now += TRIPLE_TAP_WINDOW_MS + 1;
    expect(d.tap()).toBe(false);
    now += 50;
    expect(d.tap()).toBe(false);
    now += 50;
    expect(d.tap()).toBe(true);
  });
});

describe("passphrase catalog", () => {
  it("normalizes case and trim", () => {
    expect(normalizePassphrase("  YMOS Horus  ")).toBe("ymos horus");
  });

  it("matches YMOS Horus variants", () => {
    expect(matchPassphrase("YMOS Horus")?.id).toBe("HORUS");
    expect(matchPassphrase("ymos horus")?.id).toBe("HORUS");
    expect(matchPassphrase("YMOS HORUS")?.action).toBe("runtime-toggle");
  });

  it("rejects invalid and partial phrases", () => {
    expect(matchPassphrase("wrong")).toBeNull();
    expect(matchPassphrase("ymos")).toBeNull();
    expect(matchPassphrase("ymos doctor")).toBeNull();
  });

  it("exposes only HORUS as implemented entry", () => {
    expect(PASSPHRASE_CATALOG.map((e) => e.id)).toEqual(["HORUS"]);
  });
});

describe("developer-portal events", () => {
  it("requestDeveloperPortal dispatches discover event", () => {
    const listeners = new Map<string, Set<(e: Event) => void>>();
    vi.stubGlobal("window", {
      addEventListener(type: string, fn: (e: Event) => void) {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type)!.add(fn);
      },
      removeEventListener(type: string, fn: (e: Event) => void) {
        listeners.get(type)?.delete(fn);
      },
      dispatchEvent(event: Event) {
        const set = listeners.get(event.type);
        if (set) for (const fn of [...set]) fn(event);
        return true;
      },
    });
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

    const spy = vi.fn();
    window.addEventListener(YMOS_DEVELOPER_PORTAL_DISCOVER_EVENT, spy);
    requestDeveloperPortal();
    expect(spy).toHaveBeenCalledTimes(1);

    const opened = vi.fn();
    window.addEventListener(DEVELOPER_PORTAL_OPENED_EVENT, opened);
    emitDeveloperPortalOpened({
      timestamp: "2026-08-05T00:00:00.000Z",
      platform: "web",
      build: "test",
      passphraseId: "HORUS",
    });
    expect(opened).toHaveBeenCalledTimes(1);
    expect((opened.mock.calls[0][0] as CustomEvent).detail.passphraseId).toBe(
      "HORUS",
    );

    vi.unstubAllGlobals();
  });
});
