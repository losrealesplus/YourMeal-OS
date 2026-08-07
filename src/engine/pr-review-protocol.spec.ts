/**
 * PR Review Protocol — institutional integrity (docs only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("PR Review Protocol", () => {
  it("defines Cursor gate before merge with READY / WARNINGS / BLOCKED", () => {
    const protocol = readFileSync(
      resolve(ROOT, "docs/00-status/PR_REVIEW_PROTOCOL.md"),
      "utf8",
    );
    const template = readFileSync(
      resolve(ROOT, "docs/00-status/PR_REVIEW_REPORT_TEMPLATE.md"),
      "utf8",
    );
    const adr = readFileSync(
      resolve(ROOT, "docs/adr/0097-pr-review-protocol.md"),
      "utf8",
    );
    const prTemplate = readFileSync(
      resolve(ROOT, ".github/pull_request_template.md"),
      "utf8",
    );

    expect(protocol).toContain("PR Review Protocol");
    expect(protocol).toContain("READY FOR MERGE");
    expect(protocol).toContain("READY WITH WARNINGS");
    expect(protocol).toContain("BLOCKED");
    expect(protocol).toContain("GitHub Actions is a second validation");
    expect(protocol).toContain("FOUNDATION");
    expect(protocol).toContain("No secrets");
    expect(protocol).toContain("PR REVIEW REPORT");

    expect(template).toContain("Arquitectura");
    expect(template).toContain("Resultado");

    expect(adr).toContain("Accepted");
    expect(adr).toContain("PR_REVIEW_PROTOCOL");

    expect(prTemplate).toContain("PR_REVIEW_PROTOCOL");
    expect(prTemplate).toContain("Cursor PR Review Gate");
  });
});
