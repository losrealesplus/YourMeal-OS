import { DomainError } from "@/domain/errors";

export type ItemIdentity = `dish:${string}` | `custom:${string}`;
export type AllergenSnapshotState = "HISTORICAL_UNAVAILABLE" | "UNKNOWN" | "DECLARED";

/** Optional expansion columns let the same reader consume pre-expand SELECT * rows. */
export interface OrderItemReadRow {
  id: string;
  dish_id: string | null;
  item_kind?: string;
  name_snapshot?: string | null;
  description_snapshot?: string | null;
  allergen_state?: string;
  allergens_snapshot?: string[] | null;
  snapshot_captured_at?: string | null;
  snapshot_author_id?: string | null;
}

type ReadMetadata = {
  orderItemId: string;
  name: string | null;
  description: string | null;
  metadataSource: "snapshot" | "current_catalogue" | "unavailable";
  allergenState: AllergenSnapshotState;
  allergensSnapshot: string[] | null;
  snapshotCapturedAt: string | null;
};

export type OrderItemReadModel = ReadMetadata &
  (
    | { kind: "dish"; dishId: string; identity: `dish:${string}`; recipeState: "CATALOGUE_LINKED" }
    | { kind: "custom"; dishId: null; identity: `custom:${string}`; recipeState: "NOT_AVAILABLE" }
  );

/** Pure reader, not a writer or capability gate; no historical snapshot reconstruction. */
export function readOrderItem(
  row: OrderItemReadRow,
  catalogue?: { name?: string | null; description?: string | null } | null,
): OrderItemReadModel {
  const fail = (): never => {
    throw new DomainError("INVALID_STATE", "Invalid order item read shape");
  };
  if (typeof row.id !== "string" || !row.id || row.id === "null" || row.id === "undefined")
    return fail();
  const kind = row.item_kind ?? "dish";
  const state = row.allergen_state ?? "HISTORICAL_UNAVAILABLE";
  if (!["HISTORICAL_UNAVAILABLE", "UNKNOWN", "DECLARED"].includes(state)) return fail();
  const allergens = row.allergens_snapshot ?? null;
  if (state === "HISTORICAL_UNAVAILABLE" && allergens !== null) return fail();
  if (state === "UNKNOWN" && (!Array.isArray(allergens) || allergens.length !== 0)) return fail();
  if (state === "DECLARED" && (!Array.isArray(allergens) || !allergens.length)) return fail();
  const hasName = typeof row.name_snapshot === "string" && row.name_snapshot.trim().length > 0;
  if (state !== "HISTORICAL_UNAVAILABLE" && (!hasName || !row.snapshot_captured_at)) return fail();
  const metadata: ReadMetadata = {
    orderItemId: row.id,
    name: hasName ? row.name_snapshot! : (catalogue?.name ?? null),
    description: hasName ? (row.description_snapshot ?? null) : (catalogue?.description ?? null),
    metadataSource: hasName ? "snapshot" : catalogue?.name ? "current_catalogue" : "unavailable",
    allergenState: state as AllergenSnapshotState,
    allergensSnapshot: allergens === null ? null : [...allergens],
    snapshotCapturedAt: row.snapshot_captured_at ?? null,
  };
  if (
    kind === "dish" &&
    typeof row.dish_id === "string" &&
    row.dish_id &&
    row.dish_id !== "null" &&
    row.dish_id !== "undefined"
  ) {
    return {
      ...metadata,
      kind,
      dishId: row.dish_id,
      identity: `dish:${row.dish_id}`,
      recipeState: "CATALOGUE_LINKED",
    };
  }
  if (
    kind === "custom" &&
    row.dish_id === null &&
    hasName &&
    row.snapshot_captured_at &&
    state === "UNKNOWN"
  ) {
    return {
      ...metadata,
      kind,
      dishId: null,
      identity: `custom:${row.id}`,
      recipeState: "NOT_AVAILABLE",
    };
  }
  return fail();
}

/** Temporary downstream boundary: don't feed a nullable identity into dish-only engines. */
export function requireDishReader(
  item: OrderItemReadModel,
): Extract<OrderItemReadModel, { kind: "dish" }> {
  if (item.kind !== "dish") {
    throw new DomainError("UNIMPLEMENTED", "Custom downstream reader is not enabled");
  }
  return item;
}

/** Identity for downstream maps: never use nullable dishId or display text as a key. */
export function operationalItemIdentity(input: {
  dishId: string | null;
  orderItemId: string;
  itemKind?: "dish" | "custom";
  itemIdentity?: ItemIdentity;
}): ItemIdentity {
  if (
    ["null", "undefined"].includes(input.orderItemId) ||
    (input.dishId !== null && ["null", "undefined"].includes(input.dishId))
  ) {
    throw new DomainError("INVALID_STATE", "Invalid typed operational identity");
  }
  const expected: ItemIdentity =
    input.itemKind === "custom" ? `custom:${input.orderItemId}` : `dish:${input.dishId ?? ""}`;
  if (
    (input.itemKind === "custom" && (input.dishId !== null || !input.orderItemId)) ||
    (input.itemKind !== "custom" && !input.dishId) ||
    (input.itemIdentity !== undefined && input.itemIdentity !== expected)
  ) {
    throw new DomainError("INVALID_STATE", "Invalid typed operational identity");
  }
  return expected;
}
