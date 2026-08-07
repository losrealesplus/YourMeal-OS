/**
 * Era Declaration — institutional integrity (docs only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("Era Declaration", () => {
  it("records Era 1 CLOSED · Era 2 OPEN with constitutions and mission", () => {
    const declaration = readFileSync(
      resolve(ROOT, "docs/00-status/ERA_DECLARATION.md"),
      "utf8",
    );
    const adr = readFileSync(
      resolve(ROOT, "docs/adr/0091-era-declaration.md"),
      "utf8",
    );

    expect(declaration).toContain("ERA DECLARATION");
    expect(declaration).toContain("7 August 2026");
    expect(declaration).toContain("BUILD THE ENGINE");
    expect(declaration).toContain("COMPLETE");
    expect(declaration).toContain("RETURN TIME");
    expect(declaration).toContain("Operational First");
    expect(declaration).toContain("Operational Evidence Loop");
    expect(declaration).toContain("PRODUCT LAW 001");
    expect(declaration).toContain("Operational SaaS");
    expect(declaration).toContain("systematically returns time");
    expect(declaration).toContain("Software is only one possible solution");
    expect(declaration).toContain("Time saved is the product");
    expect(declaration).toContain("Where does Isabella lose time today?");
    expect(declaration).toContain("Developer Platform");
    expect(declaration).toContain("Tenant Success Playbook");

    expect(adr).toContain("Accepted");
    expect(adr).toContain("Era 1");
    expect(adr).toContain("Era 2");
    expect(adr).toContain("ERA_DECLARATION");
  });
});
