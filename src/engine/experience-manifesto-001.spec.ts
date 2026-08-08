/**
 * EXPERIENCE MANIFESTO 001 integrity
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("EXPERIENCE MANIFESTO 001", () => {
  it("defines invisible software · mission prompts · Operational Time Saved", () => {
    const manifesto = readFileSync(
      resolve(ROOT, "docs/00-status/EXPERIENCE_MANIFESTO.md"),
      "utf8",
    );
    const adr = readFileSync(
      resolve(ROOT, "docs/adr/0099-experience-manifesto-001.md"),
      "utf8",
    );
    const prompt = readFileSync(
      resolve(ROOT, "docs/00-status/ERA2_EXPERIENCE_PROMPT.md"),
      "utf8",
    );
    const cx = readFileSync(
      resolve(ROOT, "docs/00-status/CUSTOMER_EXPERIENCE_001.md"),
      "utf8",
    );
    const prTemplate = readFileSync(
      resolve(ROOT, ".github/pull_request_template.md"),
      "utf8",
    );
    const ui = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.customer-workspace.tsx"),
      "utf8",
    );

    expect(manifesto).toContain("EXPERIENCE MANIFESTO 001");
    expect(manifesto).toContain("A great Experience is invisible");
    expect(manifesto).toContain("software succeeds when it disappears");
    expect(manifesto).toContain("Operational Time Saved");

    expect(adr).toContain("Accepted");
    expect(adr).toContain("EXPERIENCE_MANIFESTO");

    expect(prompt).toContain("Do not think about CRUD");
    expect(prompt).toContain("thirty seconds");
    expect(prompt).toContain("Company Employee");

    expect(cx).toContain("EXPERIENCE MANIFESTO 001");
    expect(cx).toContain("Empleado de empresa");
    expect(cx).toContain("Operational Time Saved");

    expect(prTemplate).toContain("Operational Time Saved");
    expect(prTemplate).toContain("Observation Sprint");

    expect(ui).toContain("¿Qué tipo de cliente vas a crear?");
    expect(ui).toContain("Empleado de empresa");
    expect(ui).toContain("company_employee");
  });
});
