/**
 * InvoiceReference — opaque handle to a BillingDocument of kind Invoice (ADR 0087).
 * Consumers pass references; they never invent invoice rows in UI or Flows.
 */

export type InvoiceReference = {
  /** Stable id within tenant billing substrate (future Facade) */
  id: string;
  tenantId: string;
  /** Human-readable label when known (e.g. draft number) — never ERP doc id as domain truth */
  label: string | null;
};
