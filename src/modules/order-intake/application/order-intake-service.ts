import { AuditService } from "@/services/audit-service";
import type { ServiceContext } from "@/services/types";
import { requireCapability, hasStaffAccess } from "@/permissions";
import { DomainError } from "@/domain/errors";
import {
  OrderService,
  type ProgramDraftOrderResult,
} from "@/modules/orders";
import type { OrderIntakeDraftCommand, OrderIntakeOrigin } from "../domain/intake-command";
import {
  CUSTOMER_SELF_CHANNELS,
  STAFF_INTAKE_CHANNELS,
  isOrderSourceChannel,
} from "../domain/order-source";

function buildOrigin(
  ctx: ServiceContext,
  command: OrderIntakeDraftCommand,
): OrderIntakeOrigin {
  return {
    channel: command.channel,
    createdByUserId: ctx.userId,
    createdByRoles: [...ctx.roles],
    createdAt: new Date().toISOString(),
    targetCustomerId: command.targetCustomerId ?? null,
    intakeNotes: command.intakeNotes ?? null,
  };
}

/**
 * CAP-008 · Order Intake Engine (ADR 0017).
 *
 * Sole public entry for constructing Orders from purchase intent.
 * Delegates persistence to OrderService (internal builder).
 */
export const OrderIntakeService = {
  /**
   * Convert purchase intent into a draft Order.
   * App path: channel `app`, no targetCustomerId.
   * Staff path: CAP-008 wizard (targetCustomerId required) — not Connected yet.
   */
  async intakeDraft(
    ctx: ServiceContext,
    command: OrderIntakeDraftCommand,
  ): Promise<ProgramDraftOrderResult> {
    requireCapability(ctx.roles, "orders.write");

    if (!command.channel || !isOrderSourceChannel(command.channel)) {
      throw new DomainError("INVALID_STATE", "Order Source (channel) is required");
    }
    if (!command.weekStart || !command.items?.length) {
      throw new DomainError("INVALID_STATE", "weekStart and at least one item are required");
    }

    const staff = hasStaffAccess(ctx.roles);
    const selfChannel = (CUSTOMER_SELF_CHANNELS as readonly string[]).includes(
      command.channel,
    );
    const staffChannel = (STAFF_INTAKE_CHANNELS as readonly string[]).includes(
      command.channel,
    );

    if (!staff && !selfChannel) {
      throw new DomainError(
        "FORBIDDEN",
        "Customers may only intake via the App channel",
      );
    }

    if (staff && command.targetCustomerId) {
      if (!staffChannel) {
        throw new DomainError(
          "INVALID_STATE",
          "Staff intake requires a staff Order Source channel",
        );
      }
      // CAP-008 next increment: program on behalf of targetCustomerId.
      throw new DomainError(
        "UNIMPLEMENTED",
        "Staff Order Intake (Tenant Surface wizard) is not Connected yet — CAP-008",
        { channel: command.channel, targetCustomerId: command.targetCustomerId },
      );
    }

    if (staff && !command.targetCustomerId && !selfChannel) {
      throw new DomainError(
        "INVALID_STATE",
        "Staff intake requires targetCustomerId",
      );
    }

    // Customer self-service (and staff using app-as-self only if they have a customer row).
    const result = await OrderService.programDraftItems(ctx, {
      weekStart: command.weekStart,
      items: command.items,
      notes: command.notes ?? null,
    });

    const origin = buildOrigin(ctx, command);

    try {
      await AuditService.write(ctx, {
        entityType: "order",
        entityId: result.order.id,
        action: "update",
        newData: {
          orderIntake: origin,
          principle: "ADR-0017 Order Intake — origin trace",
        } as unknown as Record<string, unknown>,
      });
    } catch {
      // Origin persistence is best-effort until CAP-008 origin store;
      // Order create audit already ran inside OrderService.
    }

    return result;
  },

  /** Convenience: single-day App intake (CAP-004 schedule step). */
  async intakeDraftDay(
    ctx: ServiceContext,
    input: {
      weekStart: string;
      dayDate: string;
      dishIds: string[];
      notes?: string | null;
    },
  ): Promise<ProgramDraftOrderResult> {
    return OrderIntakeService.intakeDraft(ctx, {
      channel: "app",
      weekStart: input.weekStart,
      notes: input.notes,
      items: input.dishIds.map((dishId) => ({
        dishId,
        dayDate: input.dayDate,
        qty: 1,
      })),
    });
  },
};
