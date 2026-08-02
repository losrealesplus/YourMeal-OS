import { afterEach, describe, expect, it, vi } from "vitest";
import {
  __resetFlow01EvidenceForTests,
  beginFlow01Pipeline,
  getObservedFlow01Steps,
  logFlow01Step,
} from "./flow01-evidence";

describe("flow01-evidence", () => {
  afterEach(() => {
    __resetFlow01EvidenceForTests();
    vi.restoreAllMocks();
  });

  it("emits T1 tokens once-only in order", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    beginFlow01Pipeline({ test: true });
    logFlow01Step("FLOW01_T1_STARTED");
    logFlow01Step("FLOW01_T1_COMPLETED");
    logFlow01Step("FLOW01_T1_COMPLETED"); // duplicate ignored

    expect(getObservedFlow01Steps()).toEqual([
      "FLOW01_T1_STARTED",
      "FLOW01_T1_COMPLETED",
    ]);

    const tokens = info.mock.calls
      .filter((c) => c[0] === "[FLOW-01]")
      .map((c) => c[1]);
    expect(tokens.filter((t) => t === "FLOW01_T1_STARTED")).toHaveLength(1);
    expect(tokens.filter((t) => t === "FLOW01_T1_COMPLETED")).toHaveLength(1);
    expect(tokens).toContain("SKIP_DUPLICATE");
  });
});
