export type OperationalItem = {
  dishId: string | null;
  itemIdentity?: string;
  kind?: "dish" | "custom";
  orderItemId?: string | null;
};

/** A missing custom identity must never collapse unrelated lines into null/name. */
export function operationalItemIdentity(item: OperationalItem): string {
  const valid = (id: string | null | undefined): id is string =>
    typeof id === "string" &&
    Boolean(id) &&
    id.trim() === id &&
    id !== "null" &&
    id !== "undefined";
  if (isCustomOperationalItem(item)) {
    const suffix = item.itemIdentity?.startsWith("custom:") ? item.itemIdentity.slice(7) : null;
    if (
      item.dishId === null &&
      item.kind !== "dish" &&
      valid(suffix) &&
      (item.orderItemId == null || item.orderItemId === suffix)
    )
      return item.itemIdentity!;
  } else if (valid(item.dishId)) {
    const expected = `dish:${item.dishId}`;
    if (item.itemIdentity === undefined || item.itemIdentity === expected) return expected;
  }
  throw new Error("CUSTOM_OPERATIONAL_IDENTITY_REQUIRED");
}

export function isCustomOperationalItem(item: OperationalItem): boolean {
  return item.kind === "custom" || item.dishId === null;
}
