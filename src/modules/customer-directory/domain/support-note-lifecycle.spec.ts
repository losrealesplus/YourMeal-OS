import { describe, expect, it } from "vitest";
import {
  canTransitionSupportNote,
  nextSupportNoteStatuses,
} from "./customer-directory";

describe("support note lifecycle · EP-OPS-003 Issues Resolved", () => {
  it("allows open → resolved → closed", () => {
    expect(nextSupportNoteStatuses("open")).toEqual(["resolved", "closed"]);
    expect(nextSupportNoteStatuses("resolved")).toEqual(["closed"]);
    expect(nextSupportNoteStatuses("closed")).toEqual([]);
  });

  it("rejects illegal transitions", () => {
    expect(canTransitionSupportNote("closed", "open")).toBe(false);
    expect(canTransitionSupportNote("resolved", "open")).toBe(false);
    expect(canTransitionSupportNote("open", "resolved")).toBe(true);
  });
});
