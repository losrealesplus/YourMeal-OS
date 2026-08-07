/**
 * INTERNAL — Billing runtime identity (no storage). UI never imports this.
 */

import type { IdentityFacadeView } from "@/identity/IdentityFacade";

export type BillingRuntimeIdentity = Pick<
  IdentityFacadeView,
  "session" | "tenant" | "permissions" | "currentUser"
>;
