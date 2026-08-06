/**
 * useCustomer — React entry for Operational Modules (ADR 0059).
 *
 * Bound to IdentityFacade. Consumers never see Supabase or repositories.
 */

import { useMemo } from "react";
import { useIdentity } from "@/identity/useIdentity";
import type { IdentityFacadeView } from "@/identity/IdentityFacade";
import {
  getCustomerFacade,
  type CustomerFacade,
} from "./CustomerFacade";
import type { CustomerCommand } from "./CustomerCommands";
import type { CustomerQuery } from "./CustomerQueries";
import type {
  ArchiveCustomerCommand,
  CreateCustomerCommand,
  MergeCustomerCommand,
  RestoreCustomerCommand,
  UpdateCustomerCommand,
} from "./CustomerCommands";
import type {
  GetCompanyAccountsQuery,
  GetCustomerQuery,
  GetDeliveryLocationsQuery,
  ListRecentCustomersQuery,
  SearchCustomersQuery,
} from "./CustomerQueries";
import type { CustomerRuntimeIdentity } from "./customerServiceContext";

function toRuntimeIdentity(view: IdentityFacadeView): CustomerRuntimeIdentity {
  return {
    session: view.session,
    tenant: view.tenant,
    permissions: view.permissions,
    currentUser: view.currentUser,
  };
}

export type CustomerFacadeApi = {
  facade: CustomerFacade;
  identity: CustomerRuntimeIdentity;
  /** True when Identity has session + tenant for Customer ops. */
  isReady: boolean;
  execute(command: CustomerCommand): ReturnType<CustomerFacade["execute"]>;
  query(q: CustomerQuery): ReturnType<CustomerFacade["query"]>;
  createCustomer(
    command: CreateCustomerCommand,
  ): ReturnType<CustomerFacade["createCustomer"]>;
  updateCustomer(
    command: UpdateCustomerCommand,
  ): ReturnType<CustomerFacade["updateCustomer"]>;
  archiveCustomer(
    command: ArchiveCustomerCommand,
  ): ReturnType<CustomerFacade["archiveCustomer"]>;
  restoreCustomer(
    command: RestoreCustomerCommand,
  ): ReturnType<CustomerFacade["restoreCustomer"]>;
  mergeCustomer(
    command: MergeCustomerCommand,
  ): ReturnType<CustomerFacade["mergeCustomer"]>;
  getCustomer(
    q: GetCustomerQuery,
  ): ReturnType<CustomerFacade["getCustomer"]>;
  searchCustomers(
    q: SearchCustomersQuery,
  ): ReturnType<CustomerFacade["searchCustomers"]>;
  listRecentCustomers(
    q?: ListRecentCustomersQuery,
  ): ReturnType<CustomerFacade["listRecentCustomers"]>;
  getDeliveryLocations(
    q: GetDeliveryLocationsQuery,
  ): ReturnType<CustomerFacade["getDeliveryLocations"]>;
  getCompanyAccounts(
    q?: GetCompanyAccountsQuery,
  ): ReturnType<CustomerFacade["getCompanyAccounts"]>;
};

/**
 * Canonical operational Customer hook.
 * Future Customer screens build exclusively on this API.
 */
export function useCustomer(): CustomerFacadeApi {
  const identityView = useIdentity();
  return useMemo(() => {
    const facade = getCustomerFacade();
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
      createCustomer: (command) => facade.createCustomer(identity, command),
      updateCustomer: (command) => facade.updateCustomer(identity, command),
      archiveCustomer: (command) => facade.archiveCustomer(identity, command),
      restoreCustomer: (command) => facade.restoreCustomer(identity, command),
      mergeCustomer: (command) => facade.mergeCustomer(identity, command),
      getCustomer: (q) => facade.getCustomer(identity, q),
      searchCustomers: (q) => facade.searchCustomers(identity, q),
      listRecentCustomers: (q) =>
        facade.listRecentCustomers(
          identity,
          q ?? { type: "ListRecentCustomers" },
        ),
      getDeliveryLocations: (q) => facade.getDeliveryLocations(identity, q),
      getCompanyAccounts: (q) =>
        facade.getCompanyAccounts(
          identity,
          q ?? { type: "GetCompanyAccounts" },
        ),
    };
  }, [identityView]);
}
