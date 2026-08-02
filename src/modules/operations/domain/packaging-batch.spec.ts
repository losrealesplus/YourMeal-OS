import { afterEach, describe, expect, it } from "vitest";
import {
  __resetPackagingBatchesForTests,
  completePackagingBatch,
  getPackagingBatch,
  nextPackagingStatuses,
  startPackagingBatch,
} from "./packaging-batch";

describe("PackagingBatch lifecycle", () => {
  afterEach(() => {
    __resetPackagingBatchesForTests();
  });

  it("advances CREATED → IN_PROGRESS on start", () => {
    const batch = startPackagingBatch({
      tenantId: "t1",
      orderId: "o1",
    });
    expect(batch.status).toBe("IN_PROGRESS");
    expect(getPackagingBatch("t1", "o1")?.status).toBe("IN_PROGRESS");
  });

  it("completes IN_PROGRESS → READY → CLOSED", () => {
    startPackagingBatch({ tenantId: "t1", orderId: "o1" });
    const closed = completePackagingBatch({ tenantId: "t1", orderId: "o1" });
    expect(closed.status).toBe("CLOSED");
  });

  it("exposes Spec transition map", () => {
    expect(nextPackagingStatuses("CREATED")).toEqual(["IN_PROGRESS"]);
    expect(nextPackagingStatuses("IN_PROGRESS")).toEqual(["READY"]);
    expect(nextPackagingStatuses("READY")).toEqual(["CLOSED"]);
    expect(nextPackagingStatuses("CLOSED")).toEqual([]);
  });
});
