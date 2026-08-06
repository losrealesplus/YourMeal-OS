/**
 * Customer Capability package — OPERATIONAL-002 Phase 2 (Facade).
 *
 * Public API for Operational Modules. Do not import repositories or Supabase
 * from Customer UI — only this package.
 */

export type {
  CustomerStatus,
  CustomerErrorCode,
  CustomerError,
  PartyKind,
  PartyRef,
  CustomerSummary,
  CustomerProfile,
  DeliveryLocationRef,
  CustomerContext,
  CustomerResult,
  CustomerCommandResult,
} from "./CustomerContext";

export type {
  CreateCustomerCommand,
  UpdateCustomerCommand,
  ArchiveCustomerCommand,
  RestoreCustomerCommand,
  MergeCustomerCommand,
  CustomerCommand,
} from "./CustomerCommands";

export {
  createCustomerCommand,
  updateCustomerCommand,
  archiveCustomerCommand,
  restoreCustomerCommand,
  mergeCustomerCommand,
} from "./CustomerCommands";

export type {
  GetCustomerQuery,
  SearchCustomersQuery,
  ListRecentCustomersQuery,
  GetDeliveryLocationsQuery,
  GetCompanyAccountsQuery,
  CustomerQuery,
} from "./CustomerQueries";

export {
  getCustomerQuery,
  searchCustomersQuery,
  listRecentCustomersQuery,
  getDeliveryLocationsQuery,
  getCompanyAccountsQuery,
} from "./CustomerQueries";

export {
  CustomerFacade,
  getCustomerFacade,
  resetCustomerFacade,
  type CustomerFacadeDeps,
} from "./CustomerFacade";

export { useCustomer, type CustomerFacadeApi } from "./useCustomer";
