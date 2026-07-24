import { describe, expect, it } from "vitest";
import {
  nextKitchenBatchStatuses,
  primaryKitchenBatchAction,
} from "./kitchen-batch-status";

describe("kitchen batch status machine", () => {
  it("starts preparation from pending", () => {
    expect(nextKitchenBatchStatuses("pending")).toEqual(["preparing"]);
    expect(primaryKitchenBatchAction("pending")).toEqual({
      to: "preparing",
      label: "Iniciar preparación",
    });
  });

  it("allows plating or finish from preparing", () => {
    expect(nextKitchenBatchStatuses("preparing")).toEqual([
      "plating",
      "finished",
    ]);
  });

  it("ends at finished", () => {
    expect(nextKitchenBatchStatuses("finished")).toEqual([]);
    expect(primaryKitchenBatchAction("finished")).toBeNull();
  });
});
