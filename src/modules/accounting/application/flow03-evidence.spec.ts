import { afterEach, describe, expect, it, vi } from "vitest";
import {
  __resetFlow03EvidenceForTests,
  beginFlow03Pipeline,
  getObservedFlow03Steps,
  logFlow03Step,
} from "./flow03-evidence";

describe("flow03-evidence", () => {
  afterEach(() => {
    __resetFlow03EvidenceForTests();
    vi.restoreAllMocks();
  });

  it("emits T1 tokens once-only via console [FLOW-03]", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    beginFlow03Pipeline({ orderIds: ["o1"] });
    logFlow03Step("FLOW03_T1_STARTED");
    logFlow03Step("FLOW03_T1_COMPLETED");
    logFlow03Step("FLOW03_T1_COMPLETED"); // duplicate skipped

    expect(getObservedFlow03Steps()).toEqual([
      "FLOW03_T1_STARTED",
      "FLOW03_T1_COMPLETED",
    ]);

    const tokens = info.mock.calls
      .filter((c) => c[0] === "[FLOW-03]")
      .map((c) => String(c[1]))
      .filter((t) => t.startsWith("FLOW03_T"));
    expect(tokens).toEqual([
      "FLOW03_T1_STARTED",
      "FLOW03_T1_COMPLETED",
    ]);
  });
});
