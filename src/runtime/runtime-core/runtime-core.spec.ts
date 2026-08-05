import { afterEach, describe, expect, it } from "vitest";
import {
  BUILTIN_MODULE_IDS,
  canAccessModule,
  createEvidence,
  createExportEngineStub,
  emitRuntimeCoreEvent,
  findModule,
  getModules,
  getRuntimeCore,
  isEnabled,
  onRuntimeCoreEvent,
  registerBuiltinRuntimeModules,
  registerModule,
  resetRuntimeEvents,
  resetRuntimeRegistry,
  RUNTIME_CORE_VERSION,
} from "./index";
import { resetBuiltinRegistrationFlag } from "./register-builtins";

afterEach(() => {
  resetRuntimeRegistry();
  resetRuntimeEvents();
  resetBuiltinRegistrationFlag();
});

describe("Runtime Core Foundation", () => {
  it("exposes Developer Platform kernel version 1.0.0", () => {
    expect(RUNTIME_CORE_VERSION).toBe("1.0.0");
    expect(getRuntimeCore().version).toBe("1.0.0");
  });

  it("registers and finds modules via Registry", () => {
    registerModule({
      id: "demo",
      title: "Demo",
      category: "Experimental",
      version: "0.0.1",
      permissions: "EXPERIMENTAL",
    });
    expect(findModule("demo")?.title).toBe("Demo");
    expect(isEnabled("demo")).toBe(true);
    expect(getModules().map((m) => m.id)).toContain("demo");
  });

  it("auto-registers Assets, DOM, Consistency builtins", () => {
    registerBuiltinRuntimeModules();
    registerBuiltinRuntimeModules(); // idempotent
    expect(BUILTIN_MODULE_IDS).toEqual(["assets", "dom", "consistency"]);
    for (const id of BUILTIN_MODULE_IDS) {
      expect(findModule(id)).toBeTruthy();
      expect(isEnabled(id)).toBe(true);
    }
    expect(getModules()).toHaveLength(3);
  });

  it("emits typed Core events on register", () => {
    const seen: string[] = [];
    const off = onRuntimeCoreEvent("module-registered", (e) => {
      seen.push(String((e.payload as { id: string }).id));
    });
    registerModule({
      id: "x",
      title: "X",
      category: "Core",
      version: "1",
      permissions: "INTERNAL",
    });
    expect(seen).toEqual(["x"]);
    off();
  });

  it("creates Evidence contract objects", () => {
    const ev = createEvidence({
      source: "test",
      category: "unit",
      payload: { ok: true },
    });
    expect(ev.id).toBeTruthy();
    expect(ev.timestamp).toBeTruthy();
    expect(ev.source).toBe("test");
    expect(ev.severity).toBe("info");
  });

  it("permission predicate ranks levels", () => {
    expect(canAccessModule("ENGINEERING", "PUBLIC")).toBe(true);
    expect(canAccessModule("PUBLIC", "ENGINEERING")).toBe(false);
    expect(canAccessModule("INTERNAL", "EXPERIMENTAL")).toBe(true);
  });

  it("export engine stub prepares but does not download", async () => {
    const engine = createExportEngineStub({
      collect: () => [
        createEvidence({
          source: "stub",
          category: "test",
          payload: {},
        }),
      ],
    });
    const bundle = await engine.prepare();
    expect(bundle.evidences).toHaveLength(1);
    expect(() => engine.download(bundle)).toThrow(/not implemented/i);
  });

  it("emitRuntimeCoreEvent notifies wildcard listeners", () => {
    const names: string[] = [];
    const off = onRuntimeCoreEvent("*", (e) => names.push(String(e.name)));
    emitRuntimeCoreEvent("runtime-open");
    expect(names).toContain("runtime-open");
    off();
  });
});
