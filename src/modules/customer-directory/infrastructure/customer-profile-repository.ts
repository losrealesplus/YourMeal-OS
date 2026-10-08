import type { AppSupabase } from "@/services/types";
import type {
  CustomerRequest,
  CustomerSelfProfile,
  IdentityRequest,
} from "../domain/customer-self-profile";

// Narrow adapter while generated database types await a separately authorized provider reconciliation.
type Rpc = (
  name: string,
  args: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
export function createCustomerProfileRepository(client: AppSupabase) {
  const rpc = client.rpc.bind(client) as unknown as Rpc;
  async function call<T>(name: string, args: Record<string, unknown>): Promise<T> {
    const { data, error } = await rpc(name, args);
    if (error) throw new Error(error.message);
    if (data === null && name !== "p34_customer_readback")
      throw new Error("INVALID_CUSTOMER_RESPONSE");
    return data as T;
  }
  return {
    read: (tenantId: string, customerId: string) =>
      call<CustomerSelfProfile>("p34_customer_profile", {
        _tenant: tenantId,
        _customer: customerId,
      }),
    command: (request: CustomerRequest) =>
      call<
        CustomerSelfProfile & {
          replayed: boolean;
          committedRevision?: number;
          profile?: CustomerSelfProfile;
        }
      >("p34_customer_command", {
        _tenant: request.tenantId,
        _request: request.requestId,
        _command: request.command,
      }),
    identityRequests: (tenantId: string) =>
      call<IdentityRequest[]>("p34_identity_requests", { _tenant: tenantId }),
    readback: (tenantId: string, requestId: string) =>
      call<{ customerId?: string; committedRevision?: number } | null>("p34_customer_readback", {
        _tenant: tenantId,
        _request: requestId,
      }),
  };
}
