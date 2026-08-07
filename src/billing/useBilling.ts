/**
 * useBilling — React entry for Billing Operational Outcome (ADR 0088).
 * Bound to Identity. Consumers never see Supabase, repositories, ERP, or banks.
 *
 * Billing does not initiate work — it certifies financial outcome of completed work.
 */

import { useMemo } from "react";
import { useIdentity } from "@/identity/useIdentity";
import type { IdentityFacadeView } from "@/identity/IdentityFacade";
import {
  getBillingFacade,
  type BillingFacade,
} from "./BillingFacade";
import type { BillingCommand, PrepareBillingCommand } from "./commands";
import type { BillingQuery } from "./queries";
import type {
  GetBillingQuery,
  GetPaymentStatusQuery,
  ListPendingBillingQuery,
  SearchBillingsQuery,
} from "./queries";
import type { BillingRuntimeIdentity } from "./billingServiceContext";

function toRuntimeIdentity(view: IdentityFacadeView): BillingRuntimeIdentity {
  return {
    session: view.session,
    tenant: view.tenant,
    permissions: view.permissions,
    currentUser: view.currentUser,
  };
}

export type BillingFacadeApi = {
  facade: BillingFacade;
  identity: BillingRuntimeIdentity;
  isReady: boolean;
  execute(command: BillingCommand): ReturnType<BillingFacade["execute"]>;
  query(q: BillingQuery): ReturnType<BillingFacade["query"]>;
  prepareBilling(
    command: PrepareBillingCommand,
  ): ReturnType<BillingFacade["prepareBilling"]>;
  getBilling(q: GetBillingQuery): ReturnType<BillingFacade["getBilling"]>;
  listPendingBilling(
    q: ListPendingBillingQuery,
  ): ReturnType<BillingFacade["listPendingBilling"]>;
  searchBillings(
    q: SearchBillingsQuery,
  ): ReturnType<BillingFacade["searchBillings"]>;
  getPaymentStatus(
    q: GetPaymentStatusQuery,
  ): ReturnType<BillingFacade["getPaymentStatus"]>;
};

export function useBilling(): BillingFacadeApi {
  const identityView = useIdentity();
  return useMemo(() => {
    const facade = getBillingFacade();
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
      prepareBilling: (command) => facade.prepareBilling(identity, command),
      getBilling: (q) => facade.getBilling(identity, q),
      listPendingBilling: (q) => facade.listPendingBilling(identity, q),
      searchBillings: (q) => facade.searchBillings(identity, q),
      getPaymentStatus: (q) => facade.getPaymentStatus(identity, q),
    };
  }, [identityView]);
}
