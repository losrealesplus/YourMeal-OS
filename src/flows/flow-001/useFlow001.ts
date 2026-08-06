/**
 * useFlow001 — React entry for OPERATIONAL-FLOW-001 Harness.
 * Orchestration only. Bound to Identity. Never touches storage.
 */

import { useMemo } from "react";
import { useIdentity } from "@/identity/useIdentity";
import type { IdentityFacadeView } from "@/identity/IdentityFacade";
import {
  getFlow001Harness,
  type Flow001Harness,
} from "./Flow001Harness";
import type {
  Flow001RuntimeIdentity,
  Flow001Scope,
} from "./Flow001Context";

function toRuntimeIdentity(
  view: IdentityFacadeView,
): Flow001RuntimeIdentity {
  return {
    session: view.session,
    tenant: view.tenant,
    permissions: view.permissions,
    currentUser: view.currentUser,
  };
}

export type Flow001HarnessApi = {
  harness: Flow001Harness;
  identity: Flow001RuntimeIdentity;
  isReady: boolean;
  runCommitmentToExecutedWork(
    scope: Flow001Scope,
  ): ReturnType<Flow001Harness["runCommitmentToExecutedWork"]>;
  transitionOrderToProduction(
    scope: Flow001Scope,
  ): ReturnType<Flow001Harness["transitionOrderToProduction"]>;
  transitionProductionToKitchen(
    scope: Flow001Scope,
  ): ReturnType<Flow001Harness["transitionProductionToKitchen"]>;
};

export function useFlow001(): Flow001HarnessApi {
  const identityView = useIdentity();
  return useMemo(() => {
    const harness = getFlow001Harness();
    const identity = toRuntimeIdentity(identityView);
    const isReady = Boolean(
      identity.session.present && identity.session.userId && identity.tenant?.id,
    );

    return {
      harness,
      identity,
      isReady,
      runCommitmentToExecutedWork: (scope) =>
        harness.runCommitmentToExecutedWork(identity, scope),
      transitionOrderToProduction: (scope) =>
        harness.transitionOrderToProduction(identity, scope),
      transitionProductionToKitchen: (scope) =>
        harness.transitionProductionToKitchen(identity, scope),
    };
  }, [identityView]);
}
