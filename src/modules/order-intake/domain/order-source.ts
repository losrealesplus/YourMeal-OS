/**
 * DICT-076 · Order Source — intake channel (≠ demand_channel B2B/B2C).
 * @see docs/adr/0017-order-intake.md
 */
export const ORDER_SOURCE_CHANNELS = [
  "app",
  "whatsapp",
  "phone",
  "in_person",
  "admin",
  "api",
  "csv_import",
  "other",
] as const;

export type OrderSourceChannel = (typeof ORDER_SOURCE_CHANNELS)[number];

/** Channels a customer may use for self-service intake. */
export const CUSTOMER_SELF_CHANNELS: readonly OrderSourceChannel[] = ["app"];

/** Channels staff may use on Tenant Surface (CAP-008 wizard). */
export const STAFF_INTAKE_CHANNELS: readonly OrderSourceChannel[] = [
  "whatsapp",
  "phone",
  "in_person",
  "admin",
  "api",
  "csv_import",
  "other",
];

export function isOrderSourceChannel(value: string): value is OrderSourceChannel {
  return (ORDER_SOURCE_CHANNELS as readonly string[]).includes(value);
}
