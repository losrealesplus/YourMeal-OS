import { afterEach, describe, expect, it, vi } from "vitest";
import {
  __resetFlow02EvidenceForTests,
  beginFlow02Pipeline,
  getObservedFlow02Steps,
  logFlow02Step,
} from "./flow02-evidence";

describe("flow02-evidence", () => {
  afterEach(() => {
    __resetFlow02EvidenceForTests();
    vi.restoreAllMocks();
  });

  it("emits T1 tokens once-only via console [FLOW-02]", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    beginFlow02Pipeline({ orderId: "o1" });
    logFlow02Step("FLOW02_T1_STARTED");
    logFlow02Step("FLOW02_T1_COMPLETED");
    logFlow02Step("FLOW02_T1_COMPLETED"); // duplicate skipped

    expect(getObservedFlow02Steps()).toEqual([
      "FLOW02_T1_STARTED",
      "FLOW02_T1_COMPLETED",
    ]);

    const tokens = info.mock.calls
      .filter((c) => c[0] === "[FLOW-02]")
      .map((c) => String(c[1]))
      .filter((t) => t.startsWith("FLOW02_T"));
    expect(tokens).toEqual([
      "FLOW02_T1_STARTED",
      "FLOW02_T1_COMPLETED",
    ]);
  });
});
