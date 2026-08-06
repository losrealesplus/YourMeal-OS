/**
 * INTERNAL — Kitchen runtime identity (no storage). UI never imports this.
 */

import type { IdentityFacadeView } from "@/identity/IdentityFacade";

export type KitchenRuntimeIdentity = Pick<
  IdentityFacadeView,
  "session" | "tenant" | "permissions" | "currentUser"
>;
