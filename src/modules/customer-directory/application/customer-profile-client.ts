import {
  executeCustomerCommand,
  readCustomerProfile,
  readCustomerIdentityRequests,
  readCustomerCommandResult,
} from "./customer-profile.functions";
import type { CustomerRequest } from "../domain/customer-self-profile";
/** UI service facade. SSR attaches the authenticated session; SQL derives authority. */
export const customerProfileClient = {
  read: (tenantId: string, customerId: string) =>
    readCustomerProfile({ data: { tenantId, customerId } }),
  command: (request: CustomerRequest) => executeCustomerCommand({ data: request }),
  identityRequests: (tenantId: string) => readCustomerIdentityRequests({ data: { tenantId } }),
  readback: (tenantId: string, requestId: string) =>
    readCustomerCommandResult({ data: { tenantId, requestId } }),
};
