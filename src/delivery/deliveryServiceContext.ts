/**
 * INTERNAL — Delivery runtime identity (no storage). UI never imports this.
 */

import type { IdentityFacadeView } from "@/identity/IdentityFacade";

export type DeliveryRuntimeIdentity = Pick<
  IdentityFacadeView,
  "session" | "tenant" | "permissions" | "currentUser"
>;
