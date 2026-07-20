/**
 * Domain event names — scaffold only. No bus/emitters yet.
 * @see packages/events/README.md
 */

export type DomainEventName =
  | "DishCreated"
  | "DishPublished"
  | "DishArchived"
  | "OrderConfirmed"
  | "MenuPublished"
  | "InventoryUpdated"
  | "InvoicePaid"
  | "RouteCompleted"
  | "ProductionStarted";

export type DomainEvent<T extends DomainEventName = DomainEventName> = {
  name: T;
  tenantId: string;
  occurredAt: string; // UTC ISO8601
  actorId?: string | null;
  payload: Record<string, unknown>;
};

export const DOMAIN_EVENT_NAMES: readonly DomainEventName[] = [
  "DishCreated",
  "DishPublished",
  "DishArchived",
  "OrderConfirmed",
  "MenuPublished",
  "InventoryUpdated",
  "InvoicePaid",
  "RouteCompleted",
  "ProductionStarted",
] as const;
