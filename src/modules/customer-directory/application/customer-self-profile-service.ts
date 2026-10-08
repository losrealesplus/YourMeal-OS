import type { ServiceContext } from "@/services/types";
import { customerRequestSchema, type CustomerCommand } from "../domain/customer-self-profile";
import { createCustomerProfileRepository } from "../infrastructure/customer-profile-repository";
// SQL derives actor, approved tenant membership and ownership from the verified session.
export const CustomerSelfProfileService = {
  read: (ctx: ServiceContext, id: string) =>
    createCustomerProfileRepository(ctx.supabase).read(ctx.tenantId, id),
  execute: (ctx: ServiceContext, requestId: string, command: CustomerCommand) =>
    createCustomerProfileRepository(ctx.supabase).command(
      customerRequestSchema.parse({ tenantId: ctx.tenantId, requestId, command }),
    ),
  readback: (ctx: ServiceContext, requestId: string) =>
    createCustomerProfileRepository(ctx.supabase).readback(ctx.tenantId, requestId),
};
