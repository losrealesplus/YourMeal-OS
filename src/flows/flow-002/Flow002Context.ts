/**
 * FLOW-002 operational context — orchestration only.
 * Never business entities. Capabilities own those.
 * Behaviour: Fulfill Weekly Commitment (semantic — OPERATIONAL_BEHAVIOURS).
 * @see docs/05-architecture/OPERATIONAL_FLOW_002.md
 */

import type { IdentityFacadeView } from "@/identity/IdentityFacade";

export type Flow002RuntimeIdentity = Pick<
  IdentityFacadeView,
  "session" | "tenant" | "permissions" | "currentUser"
>;

export type Flow002Scope = {
  dayDate: string;
  weekStart?: string;
};

export type Flow002TransitionId =
  | "IdentityGate"
  | "OrderHop"
  | "ProductionHop"
  | "KitchenHop"
  | "ExecutionComplete"
  | "DeliveryHop"
  | "ConfirmationHop";

/** Evidence continuity — Expected / Observed / Evidence per transition. */
export type Flow002EvidenceStep = {
  transition: Flow002TransitionId;
  expected: string;
  observed: string;
  evidence: string;
  ok: boolean;
};

export type Flow002Context = {
  scope: Flow002Scope;
  tenantId: string | null;
  operatorId: string | null;
  orderIds: string[];
  productionPlanId: string | null;
  executionUnitIds: string[];
  completedUnitId: string | null;
  assignmentIds: string[];
  confirmationId: string | null;
};
