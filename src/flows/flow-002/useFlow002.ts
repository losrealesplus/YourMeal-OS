/**
 * useFlow002 — React entry for OPERATIONAL-FLOW-002 Harness.
 * Orchestration only. Bound to Identity. Never touches storage / Billing.
 */

import { useMemo } from "react";
import { useIdentity } from "@/identity/useIdentity";
import type { IdentityFacadeView } from "@/identity/IdentityFacade";
import {
  getFlow002Harness,
  type Flow002Harness,
} from "./Flow002Harness";
import type {
  Flow002RuntimeIdentity,
  Flow002Scope,
} from "./Flow002Context";

function toRuntimeIdentity(
  view: IdentityFacadeView,
): Flow002RuntimeIdentity {
  return {
    session: view.session,
    tenant: view.tenant,
    permissions: view.permissions,
    currentUser: view.currentUser,
  };
}

export type Flow002HarnessApi = {
  harness: Flow002Harness;
  identity: Flow002RuntimeIdentity;
  isReady: boolean;
  runCommitmentToConfirmedDelivery(
    scope: Flow002Scope,
  ): ReturnType<Flow002Harness["runCommitmentToConfirmedDelivery"]>;
  transitionKitchenToDelivery(
    scope: Flow002Scope,
  ): ReturnType<Flow002Harness["transitionKitchenToDelivery"]>;
  transitionDeliveryToConfirmation(
    scope: Flow002Scope,
  ): ReturnType<Flow002Harness["transitionDeliveryToConfirmation"]>;
};

export function useFlow002(): Flow002HarnessApi {
  const identityView = useIdentity();
  return useMemo(() => {
    const harness = getFlow002Harness();
    const identity = toRuntimeIdentity(identityView);
    const isReady = Boolean(
      identity.session.present && identity.session.userId && identity.tenant?.id,
    );

    return {
      harness,
      identity,
      isReady,
      runCommitmentToConfirmedDelivery: (scope) =>
        harness.runCommitmentToConfirmedDelivery(identity, scope),
      transitionKitchenToDelivery: (scope) =>
        harness.transitionKitchenToDelivery(identity, scope),
      transitionDeliveryToConfirmation: (scope) =>
        harness.transitionDeliveryToConfirmation(identity, scope),
    };
  }, [identityView]);
}
