import { z } from "zod";
import { DomainError, type DomainErrorCode } from "@/domain/errors";
import type { AppSupabase } from "@/services/types";
import type { Json } from "@/integrations/supabase/types";
import type { CanonicalOrderCommand } from "../domain/canonical-order-write";
import type { OrderRow, OrderItemRow } from "./order-repository";

export type CanonicalOrderWriteResult = {
  order: OrderRow;
  items: OrderItemRow[];
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
        !validIdentity(item.dish_id) ||
        item.item_kind !== "dish",
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
