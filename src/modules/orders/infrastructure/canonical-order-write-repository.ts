import { z } from "zod";
import { DomainError, type DomainErrorCode } from "@/domain/errors";
import type { AppSupabase } from "@/services/types";
import type { Json } from "@/integrations/supabase/types";
import type { CanonicalOrderCommand } from "../domain/canonical-order-write";
import type { OrderRow, OrderItemReadProjection } from "./order-repository";

export type CanonicalOrderWriteResult = {
  order: OrderRow;
  items: OrderItemReadProjection[];
  committedRevision: number;
  replayed: boolean;
  inputHash: string;
};
const errors: readonly DomainErrorCode[] = [
  "PERMISSION_DENIED",
  "TENANT_MISMATCH",
  "NOT_FOUND",
  "INVALID_STATE",
  "PRICE_UNAVAILABLE",
  "PRICE_CHANGED",
  "ORDER_CLOSED",
  "MENU_LOCKED",
  "IDEMPOTENCY_CONFLICT",
  "STALE_REVISION",
  "CUSTOM_NOT_ENABLED",
  "COMMERCIAL_QUOTE_REQUIRED",
];
const customSnapshot = z
  .object({
    dish_id: z.null(),
    item_kind: z.literal("custom"),
    name_snapshot: z.string().trim().min(1).max(200),
    description_snapshot: z.string().max(2000).nullable().optional(),
    qty: z.number().int().positive().max(2147483647),
    day_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((value) => {
        const date = new Date(`${value}T00:00:00Z`);
        return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
      }),
    allergen_state: z.literal("UNKNOWN"),
    allergens_snapshot: z.array(z.never()).length(0),
    snapshot_captured_at: z
      .string()
      .min(1)
      .refine((value) => Number.isFinite(Date.parse(value))),
    unit_price: z
      .union([z.string(), z.number().finite()])
      .refine((value) => /^(?:0|[1-9]\d{0,7})(?:\.\d{1,4})?$/.test(String(value))),
    price_snapshot_status: z.enum(["captured", "explicit_zero"]),
  })
  .superRefine((item, ctx) => {
    if ((Number(item.unit_price) === 0) !== (item.price_snapshot_status === "explicit_zero"))
      ctx.addIssue({ code: "custom", message: "Invalid zero snapshot state" });
  });
const validIdentity = (value: unknown) => z.string().uuid().safeParse(value).success;
export function canonicalWriteError(message: string): DomainError {
  const code = errors.find((code) => message === code || message.startsWith(`${code}:`));
  return new DomainError(code ?? "INVALID_STATE", code ?? "Canonical order write rejected");
}
export function parseCanonicalOrderWriteResult(
  data: unknown,
  tenantId: string,
  command: CanonicalOrderCommand,
): CanonicalOrderWriteResult {
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new DomainError("INVALID_STATE", "Invalid canonical writer response");
  const result = data as unknown as CanonicalOrderWriteResult;
  if (
    result.order?.tenant_id !== tenantId ||
    !validIdentity(result.order?.id) ||
    !validIdentity(result.order?.customer_id) ||
    result.order.write_contract_version !== 2 ||
    !Array.isArray(result.items) ||
    !result.items.length ||
    !Number.isInteger(result.committedRevision) ||
    result.committedRevision < 1 ||
    typeof result.replayed !== "boolean" ||
    typeof result.inputHash !== "string" ||
    !/^[0-9a-f]{64}$/.test(result.inputHash) ||
    new Set(result.items.map((item) => item?.id)).size !== result.items.length ||
    result.items.some(
      (item) =>
        !item ||
        !validIdentity(item.id) ||
        item.tenant_id !== tenantId ||
        item.order_id !== result.order.id ||
        (item.item_kind === "custom"
          ? !customSnapshot.safeParse(item).success ||
            !/^\d{4}-\d{2}-\d{2}$/.test(result.order.week_start ?? "") ||
            !Number.isFinite(Date.parse(`${result.order.week_start}T00:00:00Z`)) ||
            item.day_date < result.order.week_start ||
            Date.parse(`${item.day_date}T00:00:00Z`) >
              Date.parse(`${result.order.week_start}T00:00:00Z`) + 6 * 86400000
          : item.item_kind !== "dish" || !validIdentity(item.dish_id)),
    )
  )
    throw new DomainError("INVALID_STATE", "Invalid canonical writer response");
  if (
    !Number.isInteger(result.order.revision) ||
    (result.replayed
      ? result.order.revision! < result.committedRevision
      : result.order.revision !== result.committedRevision) ||
    (command.operation === "modify" &&
      (result.order.id !== command.orderId ||
        result.committedRevision !== command.expectedRevision + 1)) ||
    (command.operation === "capture" &&
      command.customer.kind === "existing" &&
      result.order.customer_id !== command.customer.id)
  )
    throw new DomainError("INVALID_STATE", "Invalid canonical writer response");
  return result;
}
export function createCanonicalOrderWriteRepository(db: AppSupabase, tenantId: string) {
  return {
    async write(
      requestId: string,
      command: CanonicalOrderCommand,
    ): Promise<CanonicalOrderWriteResult> {
      let response;
      try {
        response = await db.rpc("cr_order_write_v2", {
          _tenant_id: tenantId,
          _request_id: requestId,
          _command: command as unknown as Json,
        });
      } catch {
        throw new DomainError(
          "INVALID_STATE",
          "Canonical order write unavailable; retry with the same requestId",
        );
      }
      const { data, error } = response;
      if (error) throw canonicalWriteError(error.message);
      return parseCanonicalOrderWriteResult(data, tenantId, command);
    },
  };
}
