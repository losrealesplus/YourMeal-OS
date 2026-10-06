import { describe, expect, it, vi } from "vitest";
import { createCustomCaptureSession, type CaptureTransport } from "./custom-order-capture-service";
import type { CanonicalOrderCommand } from "../domain/canonical-order-write";
import type { CanonicalOrderWriteResult } from "../infrastructure/canonical-order-write-repository";
const tenant = "10000000-0000-4000-8000-000000000001";
const id = "70000000-0000-4000-8000-000000000001";
const dish = "40000000-0000-4000-8000-000000000001";
const capture = (): CanonicalOrderCommand => ({
  operation: "capture",
  customer: { kind: "existing", id: tenant },
  weekStart: "2026-10-05",
  lines: [{ kind: "custom", name: "Tarta", qty: 1, dayDate: "2026-10-11", unitPrice: "18.00" }],
});
const result = { committedRevision: 1 } as CanonicalOrderWriteResult;
const transport = () => ({
  quote: vi.fn().mockResolvedValue({ quoteId: id, total: "29.90" }),
  custom: vi.fn().mockResolvedValue(result),
  mixed: vi.fn().mockResolvedValue(result),
});
describe("A4b canonical submission orchestration", () => {
  it("prepares pure-custom without menu/quote or writes, then commits one request", async () => {
    const io = transport();
    const session = createCustomCaptureSession(io, () => id);
    await session.prepare(tenant, capture());
    expect(io.quote).not.toHaveBeenCalled();
    expect(io.custom).not.toHaveBeenCalled();
    await session.commit();
    expect(io.custom).toHaveBeenCalledExactlyOnceWith({
      tenantId: tenant,
      requestId: id,
      command: expect.objectContaining({ operation: "capture" }),
    });
    expect(io.mixed).not.toHaveBeenCalled();
  });
  it("reviews mixed quote, binds every line and commits all of them once", async () => {
    const io = transport();
    const session = createCustomCaptureSession(io, () => id);
    const command = capture();
    command.lines.push({ kind: "dish", dishId: dish, qty: 1, dayDate: "2026-10-06" });
    const review = await session.prepare(tenant, command);
    expect(review.total).toBe("29.90");
    expect(io.mixed).not.toHaveBeenCalled();
    command.lines[0].qty = 99;
    await session.commit();
    expect(io.mixed.mock.calls[0][0]).toMatchObject({
      requestId: id,
      quoteId: id,
      command: { lines: [{ qty: 1 }, { qty: 1 }] },
    });
    expect(io.custom).not.toHaveBeenCalled();
  });
  it("preserves one request across uncertain failure and blocks changing or discarding it", async () => {
    const io = transport();
    io.custom.mockRejectedValueOnce(new Error("network timeout"));
    const uuid = vi.fn(() => id);
    const session = createCustomCaptureSession(io, uuid);
    await session.prepare(tenant, capture());
    await expect(session.commit()).rejects.toThrow();
    expect(() => session.discard()).toThrow();
    await expect(
      session.prepare(tenant, { ...capture(), orderNotes: "changed" }),
    ).rejects.toThrow();
    await session.commit();
    expect(uuid).toHaveBeenCalledOnce();
    expect(io.custom.mock.calls[0][0]).toEqual(io.custom.mock.calls[1][0]);
  });
  it("allows correction after a proven revision rejection", async () => {
    const io = transport();
    io.custom.mockRejectedValueOnce(new Error("STALE_REVISION"));
    const session = createCustomCaptureSession(io, () => id);
    await session.prepare(tenant, capture());
    await expect(session.commit()).rejects.toThrow("STALE_REVISION");
    expect(session.review?.attempted).toBe(false);
    expect(() => session.discard()).not.toThrow();
  });
  it("suppresses simultaneous double submit", async () => {
    let resolve!: (value: CanonicalOrderWriteResult) => void;
    const io: CaptureTransport = {
      ...transport(),
      custom: () =>
        new Promise((done) => {
          resolve = done;
        }),
    };
    const session = createCustomCaptureSession(io, () => id);
    await session.prepare(tenant, capture());
    const first = session.commit();
    await expect(session.commit()).rejects.toThrow();
    resolve(result);
    await first;
  });
  it("preserves modify identity/revision and omits archived lines from one command", async () => {
    const io = transport();
    const session = createCustomCaptureSession(io, () => id);
    await session.prepare(tenant, {
      operation: "modify",
      orderId: tenant,
      expectedRevision: 7,
      weekStart: "2026-10-05",
      lines: [{ ...capture().lines[0], lineId: id }],
    });
    await session.commit();
    expect(io.custom.mock.calls[0][0].command).toMatchObject({
      operation: "modify",
      expectedRevision: 7,
      lines: [{ lineId: id }],
    });
  });
  it.each(["company", "invalid-week", "override", "empty", "outside-week"])(
    "rejects %s before any transport",
    async (invalid) => {
      const io = transport();
      const session = createCustomCaptureSession(io, () => id);
      const command = capture();
      if (invalid === "company") command.demandChannel = "company";
      if (invalid === "invalid-week") command.weekStart = "2026-10-06";
      if (invalid === "outside-week") command.lines[0].dayDate = "2026-10-12";
      if (invalid === "empty") command.lines = [];
      if (invalid === "override")
        command.lines.push({
          kind: "dish",
          dishId: dish,
          qty: 1,
          dayDate: "2026-10-06",
          unitPriceOverride: "1",
          unitPriceOverrideReason: "Manual",
        });
      await expect(session.prepare(tenant, command)).rejects.toThrow();
      expect(io.quote).not.toHaveBeenCalled();
      expect(io.custom).not.toHaveBeenCalled();
    },
  );
});
