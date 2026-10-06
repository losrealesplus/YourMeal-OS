import { z } from "zod";
import { DomainError } from "@/domain/errors";
import {
  parseCanonicalOrderWrite,
  type CanonicalOrderCommand,
} from "@/modules/orders/domain/canonical-order-write";

type WithOfferLines<T extends CanonicalOrderCommand> = T extends CanonicalOrderCommand
  ? Omit<T, "lines"> & { lines: (T["lines"][number] & { slotId?: string })[] }
  : never;
export type OfferOrderCommand = WithOfferLines<CanonicalOrderCommand>;
export type OfferWriteRequest = { tenantId: string; requestId: string; command: OfferOrderCommand };
const envelope = z
  .object({
    tenantId: z.string().uuid(),
    requestId: z.string().uuid(),
    command: z.record(z.unknown()),
  })
  .strict();

/** slotId is the only extension; all price/actor/commercial authority fields stay rejected. */
export function parseOfferWriteRequest(value: unknown): OfferWriteRequest {
  const input = envelope.parse(value);
  const lines = z.array(z.record(z.unknown())).min(1).parse(input.command.lines);
  if (lines.some((line) => line.kind === "custom" && line.slotId !== undefined))
    throw new DomainError("INVALID_STATE", "Custom lines cannot claim an offer slot");
  const slotIds = lines.map((line) =>
    line.slotId === undefined ? undefined : z.string().uuid().parse(line.slotId),
  );
  const canonical = parseCanonicalOrderWrite(input.requestId, {
    ...input.command,
    lines: lines.map(({ slotId: _slot, ...line }) => line),
  });
  if (
    canonical.command.lines.some(
      (line) => line.kind === "dish" && line.unitPriceOverride !== undefined,
    )
  )
    throw new DomainError(
      "OFFER_PRICING_OVERRIDE_UNSUPPORTED",
      "Quoted offer capture does not accept manual price overrides",
    );
  return {
    tenantId: input.tenantId,
    requestId: canonical.requestId,
    command: {
      ...canonical.command,
      lines: canonical.command.lines.map((line, index) => ({
        ...line,
        ...(slotIds[index] === undefined ? {} : { slotId: slotIds[index] }),
      })),
    },
  };
}

export function parseOfferCommitRequest(value: unknown): OfferWriteRequest & { quoteId: string } {
  const input = z
    .object({
      tenantId: z.string().uuid(),
      requestId: z.string().uuid(),
      quoteId: z.string().uuid(),
      command: z.record(z.unknown()),
    })
    .strict()
    .parse(value);
  const { quoteId, ...request } = input;
  return { ...parseOfferWriteRequest(request), quoteId };
}
