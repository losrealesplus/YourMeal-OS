/**
 * FLOW-001 operational context — orchestration only.
 * Never business entities. Capabilities own those.
 * @see docs/05-architecture/OPERATIONAL_FLOW_001.md
 */

import type { IdentityFacadeView } from "@/identity/IdentityFacade";

export type Flow001RuntimeIdentity = Pick<
  IdentityFacadeView,
  "session" | "tenant" | "permissions" | "currentUser"
>;

export type Flow001Scope = {
  dayDate: string;
  weekStart?: string;
};

export type Flow001TransitionId =
  | "IdentityGate"
  | "OrderHop"
  | "ProductionHop"
  | "KitchenHop"
  | "ExecutionComplete";

/** Evidence continuity — Expected / Observed / Evidence per transition. */
export type Flow001EvidenceStep = {
  transition: Flow001TransitionId;
  expected: string;
  observed: string;
  evidence: string;
  ok: boolean;
};

export type Flow001Context = {
  scope: Flow001Scope;
  tenantId: string | null;
  operatorId: string | null;
  orderIds: string[];
  productionPlanId: string | null;
  executionUnitIds: string[];
  completedUnitId: string | null;
};
