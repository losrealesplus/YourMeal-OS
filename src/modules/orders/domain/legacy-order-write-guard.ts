import { DomainError } from "@/domain/errors";

/** Legacy multi-write paths must never replace/reprice a future v2/custom order. */
export function assertLegacyOrderWriteCompatible<
  T extends { dish_id: string | null; item_kind?: string },
>(
  order: { write_contract_version?: number },
  items: T[],
): asserts items is Array<T & { dish_id: string }> {
  if (
    (order.write_contract_version ?? 1) !== 1 ||
    items.some(
      (item) =>
        (item.item_kind ?? "dish") !== "dish" ||
        !item.dish_id ||
        item.dish_id === "null" ||
        item.dish_id === "undefined",
    )
  ) {
    throw new DomainError(
      "UNIMPLEMENTED",
      "Legacy order write cannot modify or confirm custom/v2 orders",
    );
  }
}
