/**
 * useKitchenExecution — React entry for Operational Execution (ADR 0071).
 * Bound to Identity. Consumers never see Supabase, repositories, or Orders.
 */

import { useMemo } from "react";
import { useIdentity } from "@/identity/useIdentity";
import type { IdentityFacadeView } from "@/identity/IdentityFacade";
import {
  getKitchenExecutionFacade,
  type KitchenExecutionFacade,
} from "./KitchenExecutionFacade";
import type { KitchenCommand } from "./KitchenCommands";
import type {
  CompleteExecutionCommand,
  MarkExecutionReadyCommand,
} from "./KitchenCommands";
import type { KitchenQuery } from "./KitchenQueries";
import type {
  GetBlockedExecutionQuery,
  GetCompletedExecutionQuery,
  GetExecutionProgressQuery,
  GetExecutionQueueQuery,
  GetExecutionUnitsQuery,
} from "./KitchenQueries";
import type { KitchenRuntimeIdentity } from "./kitchenServiceContext";

function toRuntimeIdentity(
  view: IdentityFacadeView,
): KitchenRuntimeIdentity {
  return {
    session: view.session,
    tenant: view.tenant,
    permissions: view.permissions,
    currentUser: view.currentUser,
  };
}

export type KitchenExecutionFacadeApi = {
  facade: KitchenExecutionFacade;
  identity: KitchenRuntimeIdentity;
  isReady: boolean;
  execute(
    command: KitchenCommand,
  ): ReturnType<KitchenExecutionFacade["execute"]>;
  query(q: KitchenQuery): ReturnType<KitchenExecutionFacade["query"]>;
  markExecutionReady(
    command: MarkExecutionReadyCommand,
  ): ReturnType<KitchenExecutionFacade["markExecutionReady"]>;
  completeExecution(
    command: CompleteExecutionCommand,
  ): ReturnType<KitchenExecutionFacade["completeExecution"]>;
  getExecutionQueue(
    q: GetExecutionQueueQuery,
  ): ReturnType<KitchenExecutionFacade["getExecutionQueue"]>;
  getExecutionUnits(
    q: GetExecutionUnitsQuery,
  ): ReturnType<KitchenExecutionFacade["getExecutionUnits"]>;
  getExecutionProgress(
    q: GetExecutionProgressQuery,
  ): ReturnType<KitchenExecutionFacade["getExecutionProgress"]>;
  getBlockedExecution(
    q: GetBlockedExecutionQuery,
  ): ReturnType<KitchenExecutionFacade["getBlockedExecution"]>;
  getCompletedExecution(
    q: GetCompletedExecutionQuery,
  ): ReturnType<KitchenExecutionFacade["getCompletedExecution"]>;
};

export function useKitchenExecution(): KitchenExecutionFacadeApi {
  const identityView = useIdentity();
  return useMemo(() => {
    const facade = getKitchenExecutionFacade();
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
      markExecutionReady: (command) =>
        facade.markExecutionReady(identity, command),
      completeExecution: (command) =>
        facade.completeExecution(identity, command),
      getExecutionQueue: (q) => facade.getExecutionQueue(identity, q),
      getExecutionUnits: (q) => facade.getExecutionUnits(identity, q),
      getExecutionProgress: (q) => facade.getExecutionProgress(identity, q),
      getBlockedExecution: (q) => facade.getBlockedExecution(identity, q),
      getCompletedExecution: (q) => facade.getCompletedExecution(identity, q),
    };
  }, [identityView]);
}
