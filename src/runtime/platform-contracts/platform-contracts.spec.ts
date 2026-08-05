/**
 * Platform Contract Tests — architecture guards (not feature tests).
 * DEVELOPER-PLATFORM-011 · Developer Platform v1.0 Freeze
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEVELOPER_PLATFORM_FREEZE,
  DEVELOPER_PLATFORM_VERSION,
  PLATFORM_PUBLIC_CONTRACTS,
} from "./index";
import {
  FORBIDDEN_ENGINE_IMPORTS,
  HOST_ADAPTER_FILE_RE,
  type EngineId,
} from "./dependency-rules";

const RUNTIME_ROOT = join(process.cwd(), "src/runtime");

function walkTsFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.endsWith(".spec.ts")) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkTsFiles(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

function engineFiles(engine: EngineId): string[] {
  return walkTsFiles(join(RUNTIME_ROOT, engine)).filter(
    (f) => !HOST_ADAPTER_FILE_RE.test(f.replace(/\\/g, "/")),
  );
}

function importViolations(
  fromEngine: EngineId,
  forbiddenTarget: string,
): string[] {
  const hits: string[] = [];
  const needle = forbiddenTarget.replace(/\/$/, "");
  for (const file of engineFiles(fromEngine)) {
    const src = readFileSync(file, "utf8");
    // Match relative imports that resolve into the forbidden package path.
    const importRe =
      /from\s+["']([^"']+)["']/g;
    let m: RegExpExecArray | null;
    while ((m = importRe.exec(src))) {
      const spec = m[1];
      if (spec.includes(needle) || spec.includes(`/${needle}`)) {
        // Allow type-only? Still a dependency — flag it.
        hits.push(`${relative(RUNTIME_ROOT, file)} → ${spec}`);
      }
      // Also catch @/runtime/... aliases
      if (
        spec.startsWith("@/runtime/") &&
        spec.slice("@/runtime/".length).includes(needle)
      ) {
        hits.push(`${relative(RUNTIME_ROOT, file)} → ${spec}`);
      }
    }
  }
  return hits;
}

describe("Platform contracts (frozen)", () => {
  it("exposes Developer Platform v1.0 freeze markers", () => {
    expect(DEVELOPER_PLATFORM_VERSION).toBe("1.0.0");
    expect(DEVELOPER_PLATFORM_FREEZE).toBe(true);
    expect(PLATFORM_PUBLIC_CONTRACTS).toEqual([
      "RuntimeCapability",
      "RuntimeIncident",
      "RuntimeKnowledge",
      "RuntimeRecommendation",
      "RuntimeRecovery",
      "RuntimeEvidence",
    ]);
  });

  it("public contract barrels re-export required types", async () => {
    const core = await import("../runtime-core");
    const cap = await import("../capability-engine");
    const inc = await import("../incident-engine");
    const know = await import("../knowledge-engine");
    const rec = await import("../recommendation-engine");
    const recovery = await import("../recovery-engine");
    const contracts = await import("./index");

    expect(typeof core.createEvidence).toBe("function");
    expect(typeof cap.registerCapability).toBe("function");
    expect(typeof inc.reportIncident).toBe("function");
    expect(typeof know.registerKnowledge).toBe("function");
    expect(typeof rec.buildRecommendations).toBe("function");
    expect(typeof recovery.runRecovery).toBe("function");
    expect(contracts.PLATFORM_PUBLIC_CONTRACTS.length).toBe(6);
  });
});

describe("Platform dependency rules", () => {
  for (const rule of FORBIDDEN_ENGINE_IMPORTS) {
    it(`${rule.from} must not import ${rule.to} (${rule.reason})`, () => {
      const violations = importViolations(rule.from, rule.to);
      expect(violations, violations.join("\n")).toEqual([]);
    });
  }

  it("Knowledge pure files do not import Host", () => {
    const violations = importViolations("knowledge-engine", "runtime-host");
    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("Recommendation pure files do not import Host", () => {
    const violations = importViolations(
      "recommendation-engine",
      "runtime-host",
    );
    expect(violations, violations.join("\n")).toEqual([]);
  });
});
