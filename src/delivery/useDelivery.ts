/**
 * useDelivery — React entry for Delivery Operational Execution (ADR 0079).
 * Bound to Identity. Consumers never see Supabase, repositories, or GPS SDKs.
 */

import { useMemo } from "react";
import { useIdentity } from "@/identity/useIdentity";
import type { IdentityFacadeView } from "@/identity/IdentityFacade";
import {
  getDeliveryFacade,
  type DeliveryFacade,
} from "./DeliveryFacade";
import type { DeliveryCommand } from "./DeliveryCommands";
import type { ConfirmDeliveryCommand } from "./DeliveryCommands";
import type { DeliveryQuery } from "./DeliveryQueries";
import type {
  GetCompletedDeliveriesQuery,
  GetDeliveryAssignmentsQuery,
  GetDeliveryContextQuery,
  GetDeliveryStopsQuery,
} from "./DeliveryQueries";
import type { DeliveryRuntimeIdentity } from "./deliveryServiceContext";

function toRuntimeIdentity(view: IdentityFacadeView): DeliveryRuntimeIdentity {
  return {
    session: view.session,
    tenant: view.tenant,
    permissions: view.permissions,
    currentUser: view.currentUser,
  };
}

export type DeliveryFacadeApi = {
  facade: DeliveryFacade;
  identity: DeliveryRuntimeIdentity;
  isReady: boolean;
  execute(command: DeliveryCommand): ReturnType<DeliveryFacade["execute"]>;
  query(q: DeliveryQuery): ReturnType<DeliveryFacade["query"]>;
  confirmDelivery(
    command: ConfirmDeliveryCommand,
  ): ReturnType<DeliveryFacade["confirmDelivery"]>;
  getDeliveryContext(
    q: GetDeliveryContextQuery,
  ): ReturnType<DeliveryFacade["getDeliveryContext"]>;
  getDeliveryAssignments(
    q: GetDeliveryAssignmentsQuery,
  ): ReturnType<DeliveryFacade["getDeliveryAssignments"]>;
  getDeliveryStops(
    q: GetDeliveryStopsQuery,
  ): ReturnType<DeliveryFacade["getDeliveryStops"]>;
  getCompletedDeliveries(
    q: GetCompletedDeliveriesQuery,
  ): ReturnType<DeliveryFacade["getCompletedDeliveries"]>;
};

export function useDelivery(): DeliveryFacadeApi {
  const identityView = useIdentity();
  return useMemo(() => {
    const facade = getDeliveryFacade();
    const identity = toRuntimeIdentity(identityView);
    const isReady = Boolean(
      identity.session.present && identity.session.userId && identity.tenant?.id,
    );

    return {
      facade,
      identity,
      isReady,
      execute: (command) => facade.execute(identity, command),
      query: (q) => facade.query(identity, q),
      confirmDelivery: (command) => facade.confirmDelivery(identity, command),
      getDeliveryContext: (q) => facade.getDeliveryContext(identity, q),
      getDeliveryAssignments: (q) =>
        facade.getDeliveryAssignments(identity, q),
      getDeliveryStops: (q) => facade.getDeliveryStops(identity, q),
      getCompletedDeliveries: (q) =>
        facade.getCompletedDeliveries(identity, q),
    };
  }, [identityView]);
}
