/**
 * useOrder — React entry for Operational Process Modules (ADR 0063).
 * Bound to Identity. Consumers never see Supabase or repositories.
 */

import { useMemo } from "react";
import { useIdentity } from "@/identity/useIdentity";
import type { IdentityFacadeView } from "@/identity/IdentityFacade";
import { getOrderFacade, type OrderFacade } from "./OrderFacade";
import type { OrderCommand } from "./OrderCommands";
import type {
  CancelOrderCommand,
  CloseOrderCommand,
  CompleteDeliveryCommand,
  ConfirmOrderCommand,
  PlanWeeklyOrderCommand,
  ReadyForDeliveryCommand,
  ReadyForKitchenCommand,
  ScheduleProductionCommand,
} from "./OrderCommands";
import type { OrderQuery } from "./OrderQueries";
import type {
  GetKitchenQueueQuery,
  GetOperationalCalendarQuery,
  GetOrderQuery,
  GetOrdersByCustomerQuery,
  GetOrdersByDeliveryDayQuery,
  GetOrdersByWeekQuery,
  GetOrdersPendingProductionQuery,
  GetOrdersReadyForDeliveryQuery,
  SearchOrdersQuery,
} from "./OrderQueries";
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
  planWeeklyOrder(
    command: PlanWeeklyOrderCommand,
  ): ReturnType<OrderFacade["planWeeklyOrder"]>;
  confirmOrder(
    command: ConfirmOrderCommand,
  ): ReturnType<OrderFacade["confirmOrder"]>;
  scheduleProduction(
    command: ScheduleProductionCommand,
  ): ReturnType<OrderFacade["scheduleProduction"]>;
  readyForKitchen(
    command: ReadyForKitchenCommand,
  ): ReturnType<OrderFacade["readyForKitchen"]>;
  readyForDelivery(
    command: ReadyForDeliveryCommand,
  ): ReturnType<OrderFacade["readyForDelivery"]>;
  completeDelivery(
    command: CompleteDeliveryCommand,
  ): ReturnType<OrderFacade["completeDelivery"]>;
  closeOrder(
    command: CloseOrderCommand,
  ): ReturnType<OrderFacade["closeOrder"]>;
  cancelOrder(
    command: CancelOrderCommand,
  ): ReturnType<OrderFacade["cancelOrder"]>;
  getOrder(q: GetOrderQuery): ReturnType<OrderFacade["getOrder"]>;
  searchOrders(q: SearchOrdersQuery): ReturnType<OrderFacade["searchOrders"]>;
  getOrdersByWeek(
    q: GetOrdersByWeekQuery,
  ): ReturnType<OrderFacade["getOrdersByWeek"]>;
  getOrdersByCustomer(
    q: GetOrdersByCustomerQuery,
  ): ReturnType<OrderFacade["getOrdersByCustomer"]>;
  getOrdersByDeliveryDay(
    q: GetOrdersByDeliveryDayQuery,
  ): ReturnType<OrderFacade["getOrdersByDeliveryDay"]>;
  getOrdersPendingProduction(
    q?: GetOrdersPendingProductionQuery,
  ): ReturnType<OrderFacade["getOrdersPendingProduction"]>;
  getOrdersReadyForDelivery(
    q?: GetOrdersReadyForDeliveryQuery,
  ): ReturnType<OrderFacade["getOrdersReadyForDelivery"]>;
  getKitchenQueue(
    q?: GetKitchenQueueQuery,
  ): ReturnType<OrderFacade["getKitchenQueue"]>;
  getOperationalCalendar(
    q: GetOperationalCalendarQuery,
  ): ReturnType<OrderFacade["getOperationalCalendar"]>;
};

/**
 * Canonical operational Order hook.
 * Future Production / Kitchen / Delivery / Billing screens build on this API.
 */
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
      closeOrder: (command) => facade.closeOrder(identity, command),
      cancelOrder: (command) => facade.cancelOrder(identity, command),
      getOrder: (q) => facade.getOrder(identity, q),
      searchOrders: (q) => facade.searchOrders(identity, q),
      getOrdersByWeek: (q) => facade.getOrdersByWeek(identity, q),
      getOrdersByCustomer: (q) => facade.getOrdersByCustomer(identity, q),
      getOrdersByDeliveryDay: (q) =>
        facade.getOrdersByDeliveryDay(identity, q),
      getOrdersPendingProduction: (q) =>
        facade.getOrdersPendingProduction(
          identity,
          q ?? { type: "GetOrdersPendingProduction" },
        ),
      getOrdersReadyForDelivery: (q) =>
        facade.getOrdersReadyForDelivery(
          identity,
          q ?? { type: "GetOrdersReadyForDelivery" },
        ),
      getKitchenQueue: (q) =>
        facade.getKitchenQueue(identity, q ?? { type: "GetKitchenQueue" }),
      getOperationalCalendar: (q) =>
        facade.getOperationalCalendar(identity, q),
    };
  }, [identityView]);
}
