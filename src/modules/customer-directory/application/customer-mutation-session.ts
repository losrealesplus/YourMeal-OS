import {
  customerRequestSchema,
  type CustomerCommand,
  type CustomerRequest,
} from "../domain/customer-self-profile";
const rejectionCodes = [
  "PERMISSION_DENIED",
  "STALE_REVISION",
  "INVALID_NAME",
  "INVALID_EMAIL",
  "INVALID_INPUT",
  "CUSTOMER_NOT_FOUND",
  "INVALID_LENGTH",
  "INVALID_STREET",
  "INVALID_TYPE",
  "INVALID_REVISION",
  "FIELD_NOT_ALLOWED",
  "ALREADY_ASSOCIATED",
  "STAFF_ONBOARDING_FORBIDDEN",
  "ONBOARDING_BLOCKED",
  "LINK_NOT_FOUND",
  "LINK_NOT_CONFIRMABLE",
  "IDENTITY_CONFLICT",
  "ADDRESS_REQUIRED",
  "ADDRESS_NOT_FOUND",
  "DEFAULT_REPLACEMENT_REQUIRED",
  "INVALID_ADDRESS_STATE",
  "OPERATION_NOT_ALLOWED",
];
export function isDefinitiveCustomerRejection(error: unknown) {
  return error instanceof Error && rejectionCodes.some((code) => error.message === code);
}
export function createCustomerMutationSession<T>(
  transport: {
    command: (request: CustomerRequest) => Promise<T>;
    readback: (tenantId: string, requestId: string) => Promise<unknown | null>;
  },
  uuid: () => string = () => crypto.randomUUID(),
) {
  let pending: CustomerRequest | null = null;
  let busy = false;
  let observedMissing = false;
  async function send(request: CustomerRequest) {
    busy = true;
    observedMissing = false;
    try {
      const result = await transport.command(request);
      pending = null;
      return result;
    } catch (error) {
      if (isDefinitiveCustomerRejection(error)) pending = null;
      throw error;
    } finally {
      busy = false;
    }
  }
  return {
    get pending() {
      return pending;
    },
    get busy() {
      return busy;
    },
    get mayRetrySame() {
      return observedMissing && !busy && pending !== null;
    },
    async execute(tenantId: string, command: CustomerCommand) {
      if (busy || pending) throw new Error("OUTCOME_RECONCILIATION_REQUIRED");
      const request = customerRequestSchema.parse({ tenantId, requestId: uuid(), command });
      // Detach caller's mutable form/patch. An uncertain retry must retain exactly the admitted bytes.
      pending = JSON.parse(JSON.stringify(request)) as CustomerRequest;
      return send(pending);
    },
    async reconcile() {
      if (!pending || busy) throw new Error("NO_RECONCILABLE_REQUEST");
      busy = true;
      try {
        const result = await transport.readback(pending.tenantId, pending.requestId);
        if (result !== null) pending = null;
        else observedMissing = true;
        return result;
      } finally {
        busy = false;
      }
    },
    async retrySame() {
      if (busy || !pending || !observedMissing) throw new Error("READBACK_REQUIRED");
      return send(pending);
    },
  };
}
