import { afterEach, describe, expect, it, vi } from "vitest";
import { RuntimeSecretBuffer } from "./runtime-secret-buffer";
import {
  YMOS_RUNTIME_OPEN_EVENT,
  YMOS_RUNTIME_TOGGLE_EVENT,
  YMOS_SECRET_GATEWAY_TRIGGERED_EVENT,
} from "./runtime-secret-events";
import {
  disposeRuntimeSecretGateway,
  installRuntimeSecretGateway,
  matchSecretCommand,
  SECRET_COMMANDS,
} from "./runtime-secret-gateway";

describe("RuntimeSecretBuffer", () => {
  it("keeps only the last N characters", () => {
    const b = new RuntimeSecretBuffer(4);
    b.push("abcdef");
    expect(b.raw()).toBe("cdef");
  });

  it("normalizes with lowercase + trim", () => {
    const b = new RuntimeSecretBuffer();
    b.push("  YMOS Horus  ");
    expect(b.normalized()).toBe("ymos horus");
  });

  it("supports backspace and clear", () => {
    const b = new RuntimeSecretBuffer();
    b.push("ab");
    b.backspace();
    expect(b.raw()).toBe("a");
    b.clear();
    expect(b.raw()).toBe("");
  });
});

describe("matchSecretCommand", () => {
  it("matches case-insensitive exact phrase", () => {
    expect(matchSecretCommand("YMOS Horus")).toBe("ymos horus");
    expect(matchSecretCommand("ymos horus")).toBe("ymos horus");
    expect(matchSecretCommand("YMOS HORUS")).toBe("ymos horus");
    expect(matchSecretCommand("Ymos Horus")).toBe("ymos horus");
  });

  it("matches when phrase is a suffix of the rolling buffer", () => {
    expect(matchSecretCommand("xyz ymos horus")).toBe("ymos horus");
  });

  it("rejects partial matches", () => {
    expect(matchSecretCommand("ymos")).toBeNull();
    expect(matchSecretCommand("horus")).toBeNull();
    expect(matchSecretCommand("ymos hor")).toBeNull();
    expect(matchSecretCommand("ymos  horus")).toBeNull();
  });

  it("exposes only ymos horus in v1 command table", () => {
    expect(Object.keys(SECRET_COMMANDS)).toEqual(["ymos horus"]);
  });
});

type Listener = (e: Event) => void;

function installFakeWindow() {
  const listeners = new Map<string, Set<Listener>>();
  const fakeWindow = {
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
    "KeyboardEvent",
    class KeyboardEvent extends Event {
      key: string;
      ctrlKey: boolean;
      metaKey: boolean;
      altKey: boolean;
      isComposing: boolean;
      constructor(
        type: string,
        init: {
          key?: string;
          bubbles?: boolean;
          cancelable?: boolean;
          ctrlKey?: boolean;
          metaKey?: boolean;
          altKey?: boolean;
        } = {},
      ) {
        super(type, init);
        this.key = init.key ?? "";
        this.ctrlKey = Boolean(init.ctrlKey);
        this.metaKey = Boolean(init.metaKey);
        this.altKey = Boolean(init.altKey);
        this.isComposing = false;
      }
    },
  );
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
  return fakeWindow;
}

describe("installRuntimeSecretGateway", () => {
  afterEach(() => {
    disposeRuntimeSecretGateway();
    vi.unstubAllGlobals();
  });

  it("dispatches ymos-runtime-toggle when phrase is typed (RUNTIME-SUITE-001)", () => {
    installFakeWindow();
    const toggles: Event[] = [];
    const opens: Event[] = [];
    const triggered: Event[] = [];
    window.addEventListener(YMOS_RUNTIME_TOGGLE_EVENT, (e) => toggles.push(e));
    window.addEventListener(YMOS_RUNTIME_OPEN_EVENT, (e) => opens.push(e));
    window.addEventListener(YMOS_SECRET_GATEWAY_TRIGGERED_EVENT, (e) =>
      triggered.push(e),
    );

    installRuntimeSecretGateway();
    for (const ch of "ymos horus") {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: ch, bubbles: true }),
      );
    }

    expect(toggles).toHaveLength(1);
    expect(opens).toHaveLength(0);
    expect(triggered).toHaveLength(1);
    expect((triggered[0] as CustomEvent).detail).toEqual({
      command: "ymos horus",
    });
  });

  it("does not fire on partial phrase", () => {
    installFakeWindow();
    const spy = vi.fn();
    window.addEventListener(YMOS_RUNTIME_TOGGLE_EVENT, spy);
    installRuntimeSecretGateway();
    for (const ch of "ymos hor") {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: ch, bubbles: true }),
      );
    }
    expect(spy).not.toHaveBeenCalled();
  });

  it("does not preventDefault (forms stay intact)", () => {
    installFakeWindow();
    installRuntimeSecretGateway();
    const e = new KeyboardEvent("keydown", {
      key: "a",
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
  });
});
