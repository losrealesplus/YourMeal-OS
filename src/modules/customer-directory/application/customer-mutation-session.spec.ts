import { describe, it, expect, vi } from "vitest";
import { createCustomerMutationSession } from "./customer-mutation-session";
const id = "10000000-0000-4000-8000-000000000001";
const command = {
  operation: "profile" as const,
  customerId: id,
  expectedRevision: 1,
  patch: { displayName: "Ana" },
};
describe("P34 uncertain outcomes", () => {
  it("does not duplicate a committed request after a lost response", async () => {
    const commandFn = vi.fn().mockRejectedValue(new Error("transport lost"));
    const readback = vi.fn().mockResolvedValue({ customerId: id, committedRevision: 2 });
    const session = createCustomerMutationSession({ command: commandFn, readback }, () => id);
    await expect(session.execute(id, command)).rejects.toThrow("transport");
    await expect(session.execute(id, command)).rejects.toThrow("RECONCILIATION");
    expect(await session.reconcile()).toEqual({ customerId: id, committedRevision: 2 });
    expect(commandFn).toHaveBeenCalledTimes(1);
    expect(session.pending).toBeNull();
  });
  it("absence never silently resends; explicit retry keeps exact original request", async () => {
    const commandFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("lost"))
      .mockResolvedValueOnce({ revision: 2 });
    const readback = vi.fn().mockResolvedValue(null);
    const uuid = vi.fn(() => id);
    const session = createCustomerMutationSession({ command: commandFn, readback }, uuid);
    const mutable = { ...command, patch: { displayName: "Original" } };
    await expect(session.execute(id, mutable)).rejects.toThrow();
    mutable.patch.displayName = "Changed";
    await session.reconcile();
    expect(commandFn).toHaveBeenCalledTimes(1);
    await session.retrySame();
    expect(commandFn.mock.calls[1][0]).toEqual(commandFn.mock.calls[0][0]);
    expect(commandFn.mock.calls[1][0].command.patch.displayName).toBe("Original");
    expect(uuid).toHaveBeenCalledTimes(1);
  });
  it("does not retry without readback", async () => {
    const session = createCustomerMutationSession(
      { command: vi.fn().mockRejectedValue(new Error("lost")), readback: vi.fn() },
      () => id,
    );
    await expect(session.execute(id, command)).rejects.toThrow();
    await expect(session.retrySame()).rejects.toThrow("READBACK_REQUIRED");
  });
  it("explicit SQL rejection allows correction without claiming a successful commit", async () => {
    const session = createCustomerMutationSession(
      { command: vi.fn().mockRejectedValue(new Error("STALE_REVISION")), readback: vi.fn() },
      () => id,
    );
    await expect(session.execute(id, command)).rejects.toThrow("STALE_REVISION");
    expect(session.pending).toBeNull();
  });
  it("unknown error text cannot unlock an uncertain session", async () => {
    const session = createCustomerMutationSession(
      {
        command: vi.fn().mockRejectedValue(new Error("STALE_REVISION? network")),
        readback: vi.fn(),
      },
      () => id,
    );
    await expect(session.execute(id, command)).rejects.toThrow();
    expect(session.pending).not.toBeNull();
  });
  it("blocks a second click while first request is in flight", async () => {
    let done!: (v: unknown) => void;
    const session = createCustomerMutationSession(
      {
        command: () =>
          new Promise((resolve) => {
            done = resolve;
          }),
        readback: vi.fn(),
      },
      () => id,
    );
    const first = session.execute(id, command);
    await expect(session.execute(id, command)).rejects.toThrow("RECONCILIATION");
    done({ revision: 2 });
    await first;
  });
});
