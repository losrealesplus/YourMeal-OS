import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { customerRequestSchema } from "../domain/customer-self-profile";
const read = z.object({ tenantId: z.string().uuid(), customerId: z.string().uuid() }).strict();
export const readCustomerProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => read.parse(v))
  .handler(async ({ context, data }) => {
    const { createCustomerProfileRepository } =
      await import("../infrastructure/customer-profile-repository");
    return createCustomerProfileRepository(context.supabase).read(data.tenantId, data.customerId);
  });
export const executeCustomerCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => customerRequestSchema.parse(v))
  .handler(async ({ context, data }) => {
    const { createCustomerProfileRepository } =
      await import("../infrastructure/customer-profile-repository");
    return createCustomerProfileRepository(context.supabase).command(data);
  });
const scope = z.object({ tenantId: z.string().uuid() }).strict();
export const readCustomerIdentityRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => scope.parse(v))
  .handler(async ({ context, data }) => {
    const { createCustomerProfileRepository } =
      await import("../infrastructure/customer-profile-repository");
    return createCustomerProfileRepository(context.supabase).identityRequests(data.tenantId);
  });
const readback = z.object({ tenantId: z.string().uuid(), requestId: z.string().uuid() }).strict();
export const readCustomerCommandResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => readback.parse(v))
  .handler(async ({ context, data }) => {
    const { createCustomerProfileRepository } =
      await import("../infrastructure/customer-profile-repository");
    return createCustomerProfileRepository(context.supabase).readback(
      data.tenantId,
      data.requestId,
    );
  });
