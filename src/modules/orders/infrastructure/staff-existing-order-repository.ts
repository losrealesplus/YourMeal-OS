import type { ServiceContext } from "@/services/types";
import { DomainError } from "@/domain/errors";
import type {
  StaffOrderCaptureResult,
  UniversalOrderCaptureDTO,
} from "../application/staff-order-capture-service";

/** One database transaction; no fallback to separate writes after an RPC error. */
export function createStaffExistingOrderRepository(client: ServiceContext["supabase"]) {
  return {
    async capture(
      tenantId: string,
      dto: UniversalOrderCaptureDTO,
    ): Promise<StaffOrderCaptureResult> {
      if (dto.customer.mode !== "existing")
        throw new DomainError("INVALID_STATE", "Existing customer required.");
      // This prepared migration is not yet part of the generated provider types.
      const rpc = client.rpc.bind(client) as unknown as (
        name: "capture_staff_existing_order",
        args: { _tenant_id: string; _command: unknown },
      ) => PromiseLike<{ data: StaffOrderCaptureResult | null; error: { message: string } | null }>;
      const { data, error } = await rpc("capture_staff_existing_order", {
        _tenant_id: tenantId,
        _command: {
          customerId: dto.customer.customerId,
          weekStart: dto.weekStart,
          orderNotes: dto.orderNotes,
          autoConfirm: !!dto.autoConfirm,
          demandChannel: dto.demandChannel ?? "individual",
          companyId: dto.companyId,
          siteId: dto.siteId,
          organizationalUnitId: dto.organizationalUnitId,
          dietaryOverride: dto.dietaryOverride,
          lines: dto.lines,
        },
      });
      if (error || !data)
        throw new DomainError(
          "INVALID_STATE",
          "No se pudo guardar el pedido completo. No se reintentó la operación.",
        );
      return data;
    },
  };
}
