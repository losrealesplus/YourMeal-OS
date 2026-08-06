/**
 * useOrder — React entry for Operational Process Modules (ADR 0063).
 * Bound to Identity. Consumers never see Supabase or repositories.
 */

import { useMemo } from "react";
import { useIdentity } from "@/identity/useIdentity";
import type { IdentityFacadeView } from "@/identity/IdentityFacade";
import { getOrderFacade, type OrderFacade } from "./OrderFacade";
import type { OrderCommand } from "./OrderCommands";
import type { OrderQuery } from "./OrderQueries";
import type { OrderRuntimeIdentity } from "./orderServiceContext";

function toRuntimeIdentity(view: IdentityFacadeView): OrderRuntimeIdentity {
  return {
    session: view.session,
    tenant: view.tenant,
    permissions: view.permissions,
    currentUser: view.currentUser,
  };
}

export type OrderFacadeApi = {
  facade: OrderFacade;
  identity: OrderRuntimeIdentity;
  isReady: boolean;
  execute(command: OrderCommand): ReturnType<OrderFacade["execute"]>;
  query(q: OrderQuery): ReturnType<OrderFacade["query"]>;
  planWeeklyOrder: OrderFacade["planWeeklyOrder"];
  confirmOrder: OrderFacade["confirmOrder"];
  scheduleProduction: OrderFacade["scheduleProduction"];
  readyForKitchen: OrderFacade["readyForKitchen"];
  readyForDelivery: OrderFacade["readyForDelivery"];
  completeDelivery: OrderFacade["completeDelivery"];
  getOrder: OrderFacade["getOrder"];
  searchOrders: OrderFacade["searchOrders"];
  getKitchenQueue: OrderFacade["getKitchenQueue"];
};

export function useOrder(): OrderFacadeApi {
  const identityView = useIdentity();
  return useMemo(() => {
    const facade = getOrderFacade();
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
      planWeeklyOrder: (command) => facade.planWeeklyOrder(identity, command),
      confirmOrder: (command) => facade.confirmOrder(identity, command),
      scheduleProduction: (command) =>
        facade.scheduleProduction(identity, command),
      readyForKitchen: (command) => facade.readyForKitchen(identity, command),
      readyForDelivery: (command) => facade.readyForDelivery(identity, command),
      completeDelivery: (command) => facade.completeDelivery(identity, command),
      getOrder: (q) => facade.getOrder(identity, q),
      searchOrders: (q) => facade.searchOrders(identity, q),
      getKitchenQueue: (q) => facade.getKitchenQueue(identity, q),
    };
  }, [identityView]);
}
