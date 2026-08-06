/**
 * useProduction — React entry for Operational Execution planning (ADR 0067).
 * Bound to Identity. Consumers never see Supabase or repositories.
 */

import { useMemo } from "react";
import { useIdentity } from "@/identity/useIdentity";
import type { IdentityFacadeView } from "@/identity/IdentityFacade";
import {
  getProductionFacade,
  type ProductionFacade,
} from "./ProductionFacade";
import type { ProductionCommand } from "./ProductionCommands";
import type {
  CloseBatchCommand,
  GenerateProductionPlanCommand,
  MarkBatchReadyCommand,
  RecalculateLoadCommand,
} from "./ProductionCommands";
import type { ProductionQuery } from "./ProductionQueries";
import type {
  GetOpenBatchesQuery,
  GetProductionCalendarQuery,
  GetProductionLoadQuery,
  GetProductionPlanQuery,
  GetProductionQueueQuery,
  GetReadyBatchesQuery,
} from "./ProductionQueries";
import type { ProductionRuntimeIdentity } from "./productionServiceContext";

function toRuntimeIdentity(
  view: IdentityFacadeView,
): ProductionRuntimeIdentity {
  return {
    session: view.session,
    tenant: view.tenant,
    permissions: view.permissions,
    currentUser: view.currentUser,
  };
}

export type ProductionFacadeApi = {
  facade: ProductionFacade;
  identity: ProductionRuntimeIdentity;
  isReady: boolean;
  execute(command: ProductionCommand): ReturnType<ProductionFacade["execute"]>;
  query(q: ProductionQuery): ReturnType<ProductionFacade["query"]>;
  generateProductionPlan(
    command: GenerateProductionPlanCommand,
  ): ReturnType<ProductionFacade["generateProductionPlan"]>;
  recalculateLoad(
    command: RecalculateLoadCommand,
  ): ReturnType<ProductionFacade["recalculateLoad"]>;
  markBatchReady(
    command: MarkBatchReadyCommand,
  ): ReturnType<ProductionFacade["markBatchReady"]>;
  closeBatch(
    command: CloseBatchCommand,
  ): ReturnType<ProductionFacade["closeBatch"]>;
  getProductionPlan(
    q: GetProductionPlanQuery,
  ): ReturnType<ProductionFacade["getProductionPlan"]>;
  getProductionQueue(
    q: GetProductionQueueQuery,
  ): ReturnType<ProductionFacade["getProductionQueue"]>;
  getProductionLoad(
    q: GetProductionLoadQuery,
  ): ReturnType<ProductionFacade["getProductionLoad"]>;
  getOpenBatches(
    q: GetOpenBatchesQuery,
  ): ReturnType<ProductionFacade["getOpenBatches"]>;
  getReadyBatches(
    q: GetReadyBatchesQuery,
  ): ReturnType<ProductionFacade["getReadyBatches"]>;
  getProductionCalendar(
    q: GetProductionCalendarQuery,
  ): ReturnType<ProductionFacade["getProductionCalendar"]>;
};

export function useProduction(): ProductionFacadeApi {
  const identityView = useIdentity();
  return useMemo(() => {
    const facade = getProductionFacade();
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
      generateProductionPlan: (command) =>
        facade.generateProductionPlan(identity, command),
      recalculateLoad: (command) => facade.recalculateLoad(identity, command),
      markBatchReady: (command) => facade.markBatchReady(identity, command),
      closeBatch: (command) => facade.closeBatch(identity, command),
      getProductionPlan: (q) => facade.getProductionPlan(identity, q),
      getProductionQueue: (q) => facade.getProductionQueue(identity, q),
      getProductionLoad: (q) => facade.getProductionLoad(identity, q),
      getOpenBatches: (q) => facade.getOpenBatches(identity, q),
      getReadyBatches: (q) => facade.getReadyBatches(identity, q),
      getProductionCalendar: (q) => facade.getProductionCalendar(identity, q),
    };
  }, [identityView]);
}
