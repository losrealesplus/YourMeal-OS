import { DomainError } from "@/domain/errors";
import { canonicalCustomLineSchema, type CanonicalCustomLine } from "./canonical-order-write";
import type { RepeatCustomProposal } from "./repeat-order";

/** No historical price/UUID authorizes a new capture; explicit current intent is mandatory. */
export function confirmedCustomRepeatLine(
  proposal: RepeatCustomProposal,
  confirmation: unknown,
): CanonicalCustomLine {
  const intent = canonicalCustomLineSchema.safeParse(confirmation);
  if (
    !intent.success ||
    intent.data.lineId ||
    intent.data.repeatConfirmation?.sourceOrderItemId !== proposal.sourceOrderItemId
  )
    throw new DomainError("INVALID_STATE", "Custom repeat requires current confirmed intent");
  const line = intent.data;
  const bound = line.repeatConfirmation!;
  if (
    bound.confirmedName !== line.name ||
    bound.confirmedDescription !== (line.description ?? null) ||
    bound.confirmedQuantity !== line.qty ||
    bound.confirmedDayDate !== line.dayDate ||
    bound.confirmedUnitPrice !== line.unitPrice ||
    (/^0(?:\.0{1,4})?$/.test(line.unitPrice) && line.explicitZeroConfirmed !== true)
  )
    throw new DomainError("INVALID_STATE", "Custom repeat intent changed after confirmation");
  return line;
}
