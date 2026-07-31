import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@capacitor/preferences", () => ({
  Preferences: {
    get: vi.fn(async () => ({ value: null as string | null })),
    set: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
    clear: vi.fn(async () => {}),
  },
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import {
  createCapacitorStorageProvider,
  createMemoryStorageProvider,
  createSupabaseAuthStorage,
  createWebStorageProvider,
  getStorageProvider,
  resetStorageProviderCache,
  setStorageProviderForTests,
} from "./index";

afterEach(() => {
  setStorageProviderForTests(null);
  resetStorageProviderCache();
  vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
  vi.mocked(Preferences.get).mockReset();
  vi.mocked(Preferences.set).mockReset();
  vi.mocked(Preferences.remove).mockReset();
  vi.mocked(Preferences.clear).mockReset();
  vi.mocked(Preferences.get).mockResolvedValue({ value: null });
});

describe("StorageProvider · memory adapter", () => {
  it("supports get / set / remove / has / clear", async () => {
    const store = createMemoryStorageProvider();
    expect(store.backend).toBe("memory");
    expect(await store.get("k")).toBeNull();
    expect(await store.has("k")).toBe(false);

    await store.set("k", "v");
    expect(await store.get("k")).toBe("v");
    expect(await store.has("k")).toBe(true);

    await store.remove("k");
    expect(await store.get("k")).toBeNull();

    await store.set("a", "1");
    await store.set("b", "2");
    await store.clear();
    expect(await store.get("a")).toBeNull();
    expect(await store.get("b")).toBeNull();
  });
});

describe("StorageProvider · web adapter", () => {
  beforeEach(() => {
    const map = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
        setItem: (k: string, v: string) => {
          map.set(k, v);
        },
        removeItem: (k: string) => {
          map.delete(k);
        },
        clear: () => map.clear(),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads and writes through localStorage without exposing it to callers", async () => {
    const store = createWebStorageProvider();
    expect(store.backend).toBe("web");
    await store.set("pref", "es");
    expect(await store.get("pref")).toBe("es");
    await store.remove("pref");
    expect(await store.has("pref")).toBe(false);
  });
});

describe("StorageProvider · capacitor adapter", () => {
  it("delegates to Preferences plugin", async () => {
    vi.mocked(Preferences.get).mockResolvedValueOnce({ value: "native-val" });
    const store = createCapacitorStorageProvider();
    expect(store.backend).toBe("capacitor");
    expect(await store.get("session")).toBe("native-val");
    expect(Preferences.get).toHaveBeenCalledWith({ key: "session" });

    await store.set("session", "x");
    expect(Preferences.set).toHaveBeenCalledWith({
      key: "session",
      value: "x",
    });

    await store.remove("session");
    expect(Preferences.remove).toHaveBeenCalledWith({ key: "session" });

    await store.clear();
    expect(Preferences.clear).toHaveBeenCalled();
  });

  it("reports has() from Preferences value", async () => {
    vi.mocked(Preferences.get).mockResolvedValueOnce({ value: "1" });
    const store = createCapacitorStorageProvider();
    expect(await store.has("flag")).toBe(true);
  });
});

describe("getStorageProvider · resolver", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns memory backend when window is undefined (SSR)", () => {
    vi.stubGlobal("window", undefined);
    const store = getStorageProvider();
    expect(store.backend).toBe("memory");
  });

  it("returns web adapter when not native", () => {
    const map = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
        setItem: (k: string, v: string) => map.set(k, v),
        removeItem: (k: string) => map.delete(k),
        clear: () => map.clear(),
      },
    });
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    expect(getStorageProvider().backend).toBe("web");
  });

  it("returns capacitor adapter when native shell is detected", () => {
    vi.stubGlobal("window", globalThis);
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    expect(getStorageProvider().backend).toBe("capacitor");
  });

  it("honors test override", async () => {
    const stub = createMemoryStorageProvider({ t: "1" });
    setStorageProviderForTests(stub);
    vi.stubGlobal("window", globalThis);
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    expect(getStorageProvider()).toBe(stub);
    expect(await getStorageProvider().get("t")).toBe("1");
  });
});

describe("createSupabaseAuthStorage", () => {
  it("bridges getItem / setItem / removeItem through StorageProvider", async () => {
    const mem = createMemoryStorageProvider();
    setStorageProviderForTests(mem);
    const authStorage = createSupabaseAuthStorage();

    await authStorage.setItem("sb-key", "token");
    expect(await authStorage.getItem("sb-key")).toBe("token");
    await authStorage.removeItem("sb-key");
    expect(await authStorage.getItem("sb-key")).toBeNull();
  });
});
