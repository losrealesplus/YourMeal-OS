import { z } from "zod";
import { DomainError, type DomainErrorCode } from "@/domain/errors";
import type { AppSupabase } from "@/services/types";

export const lifecycleActions = [
  "confirm",
  "cancel",
  "start_production",
  "complete_production",
  "start_packing",
  "complete_packing",
  "assign_delivery",
  "dispatch",
  "delivery_issue",
  "retry_delivery",
  "complete_delivery",
  "service_start",
  "service_prepare",
  "service_ready",
  "service_dispatch",
  "service_deliver",
  "service_issue",
  "service_retry",
] as const;
export type LifecycleAction = (typeof lifecycleActions)[number];
const states = z.enum([
  "draft",
  "confirmed",
  "in_production",
  "prepared",
  "ready_for_delivery",
  "out_for_delivery",
  "delivery_issue",
  "delivered",
  "cancelled",
]);
export const lifecycleAttemptSchema = z
  .object({
    requestId: z.string().uuid(),
    command: z
      .object({
        schemaVersion: z.literal(1),
        orderId: z.string().uuid(),
        action: z.enum(lifecycleActions),
        fromState: states,
        expectedRevision: z.number().int().nonnegative(),
        reason: z.string().max(2000).optional(),
        serviceId: z.string().uuid().optional(),
      })
      .strict(),
  })
  .strict();
export type LifecycleAttempt = z.infer<typeof lifecycleAttemptSchema>;

const contextSchema = z.object({
  orderId: z.string().uuid(),
  status: states,
  revision: z.number().int().nonnegative(),
  writeContractVersion: z.union([z.literal(1), z.literal(2)]),
  evidence: z
    .object({
      production_started_at: z.string().nullable(),
      production_completed_at: z.string().nullable(),
      packing_started_at: z.string().nullable(),
      packing_completed_at: z.string().nullable(),
      assigned_at: z.string().nullable(),
    })
    .nullable(),
});
const resultSchema = z.object({
  tenantId: z.string().uuid(),
  orderId: z.string().uuid(),
  toState: states,
  committedRevision: z.number().int().nonnegative(),
  outcome: z.enum(["COMMITTED", "ALREADY_CANCELLED"]),
  requestId: z.string().uuid().optional(),
  actorId: z.string().uuid().optional(),
  schemaVersion: z.literal(1).optional(),
  fromState: states.optional(),
  serviceId: z.string().uuid().optional(),
  serviceStatus: z.string().optional(),
  resolutionRequired: z.boolean().optional(),
});
type Rpc = (
  name: string,
  args: Record<string, unknown>,
) => Promise<{ data: unknown; error: unknown }>;
const codes: DomainErrorCode[] = [
  "PERMISSION_DENIED",
  "NOT_FOUND",
  "INVALID_STATE",
  "ORDER_CLOSED",
  "REQUEST_ID_CONFLICT",
  "REVISION_CONFLICT",
  "OPERATIONAL_WORK_STARTED",
  "OPERATIONAL_EVIDENCE_REQUIRED",
  "DELIVERY_RESOLUTION_REQUIRED",
];

async function call(client: AppSupabase, name: string, args: Record<string, unknown>) {
  let response: Awaited<ReturnType<Rpc>>;
  try {
    response = await (client.rpc as unknown as Rpc)(name, args);
  } catch {
    throw new DomainError(
      "LIFECYCLE_RESULT_UNCERTAIN",
      "No se pudo confirmar el resultado. Reconsulta el pedido antes de continuar.",
    );
  }
  const { data, error } = response;
  if (error) {
    const message =
      typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : "";
    const code = codes.find((candidate) => message === candidate);
    if (code) {
      const messages: Partial<Record<DomainErrorCode, string>> = {
        PERMISSION_DENIED: "No tienes permiso para realizar esta operación.",
        NOT_FOUND: "No se encontró el pedido o servicio.",
        INVALID_STATE: "Esta operación no está permitida desde el estado actual.",
        ORDER_CLOSED: "El pedido está cerrado para esta operación.",
        OPERATIONAL_WORK_STARTED:
          "Hay trabajo operativo activo que no puede detenerse con seguridad.",
        OPERATIONAL_EVIDENCE_REQUIRED: "Falta completar un paso operativo requerido.",
        DELIVERY_RESOLUTION_REQUIRED:
          "La entrega necesita una resolución explícita; hay servicios sin evidencia de entrega.",
        REVISION_CONFLICT: "El pedido cambió. Actualízalo antes de continuar.",
        REQUEST_ID_CONFLICT: "Este intento no coincide con la operación original.",
      };
      throw new DomainError(code, messages[code] ?? code);
    }
    // Retain the exact attempt for reconciliation/retry. Never fallback to direct UPDATE.
    throw new DomainError(
      "LIFECYCLE_RESULT_UNCERTAIN",
      "No se pudo confirmar el resultado. Reconsulta el pedido antes de iniciar otra operación.",
    );
  }
  return data;
}

export async function readLifecycleContext(client: AppSupabase, tenantId: string, orderId: string) {
  return contextSchema.parse(
    await call(client, "cr_order_lifecycle_context", {
      _tenant_id: tenantId,
      _order_id: orderId,
    }),
  );
}

/** Build once per user intent; preserve this object unchanged for an uncertain retry. */
export function createLifecycleAttempt(
  order: { id: string; status: z.infer<typeof states>; revision: number },
  action: LifecycleAction,
  extra: { reason?: string; serviceId?: string } = {},
): LifecycleAttempt {
  return lifecycleAttemptSchema.parse({
    requestId: crypto.randomUUID(),
    command: {
      schemaVersion: 1,
      orderId: order.id,
      fromState: order.status,
      expectedRevision: order.revision,
      action,
      ...extra,
    },
  });
}

export async function executeLifecycleAttempt(
  client: AppSupabase,
  tenantId: string,
  attempt: LifecycleAttempt,
) {
  const input = lifecycleAttemptSchema.parse(attempt);
  const parsed = resultSchema.safeParse(
    await call(client, "cr_order_lifecycle_v2", {
      _tenant_id: tenantId,
      _request_id: input.requestId,
      _command: input.command,
    }),
  );
  if (!parsed.success)
    throw new DomainError(
      "LIFECYCLE_RESULT_UNCERTAIN",
      "No se pudo validar el resultado de la operación.",
    );
  const result = parsed.data;
  if (
    result.tenantId !== tenantId ||
    result.orderId !== input.command.orderId ||
    (result.outcome === "ALREADY_CANCELLED" &&
      (input.command.action !== "cancel" || result.toState !== "cancelled")) ||
    (result.outcome === "COMMITTED" &&
      (result.requestId !== input.requestId ||
        !result.actorId ||
        result.schemaVersion !== 1 ||
        result.fromState !== input.command.fromState ||
        result.committedRevision !== input.command.expectedRevision + 1))
  ) {
    throw new DomainError(
      "LIFECYCLE_RESULT_UNCERTAIN",
      "La identidad del resultado no coincide con la operación.",
    );
  }
  return result;
}
