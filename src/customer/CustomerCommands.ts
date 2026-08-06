/**
 * Customer Commands — writable intents (OPERATIONAL-002 Phase 2).
 *
 * Not CRUD verbs (`save` / `update`). Business operations.
 * MergeCustomer is a future extension point.
 */

import type { PartyRef } from "./CustomerContext";

/** Ensure / provision a demand party. */
export type CreateCustomerCommand =
  | {
      type: "CreateCustomer";
      partyKind: "individual";
      /** CJ-001 — ensure Individual Customer for the current Identity session. */
      mode: "ensure_for_session";
      displayName?: string | null;
    }
  | {
      type: "CreateCustomer";
      partyKind: "company_account";
      mode: "provision";
      name: string;
      contactName: string;
      contactEmail: string;
      contactPhone?: string | null;
      vatId?: string | null;
      commercialTerms?: string | null;
      fiscalAddress: string;
      deliveryAddress?: string | null;
      siteName?: string;
      unitName?: string;
      orgUnitLabel?: string;
    };

export type UpdateCustomerCommand = {
  type: "UpdateCustomer";
  partyRef: PartyRef;
  patch: {
    displayName?: string | null;
    email?: string | null;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
  };
};

export type ArchiveCustomerCommand = {
  type: "ArchiveCustomer";
  partyRef: PartyRef;
};

export type RestoreCustomerCommand = {
  type: "RestoreCustomer";
  partyRef: PartyRef;
};

/** Future — Individual merge into another Individual. */
export type MergeCustomerCommand = {
  type: "MergeCustomer";
  source: PartyRef;
  target: PartyRef;
};

export type CustomerCommand =
  | CreateCustomerCommand
  | UpdateCustomerCommand
  | ArchiveCustomerCommand
  | RestoreCustomerCommand
  | MergeCustomerCommand;

export function createCustomerCommand(
  input:
    | {
        partyKind: "individual";
        mode: "ensure_for_session";
        displayName?: string | null;
      }
    | {
        partyKind: "company_account";
        mode: "provision";
        name: string;
        contactName: string;
        contactEmail: string;
        contactPhone?: string | null;
        vatId?: string | null;
        commercialTerms?: string | null;
        fiscalAddress: string;
        deliveryAddress?: string | null;
        siteName?: string;
        unitName?: string;
        orgUnitLabel?: string;
      },
): CreateCustomerCommand {
  return { type: "CreateCustomer", ...input } as CreateCustomerCommand;
}

export function updateCustomerCommand(
  input: Omit<UpdateCustomerCommand, "type">,
): UpdateCustomerCommand {
  return { type: "UpdateCustomer", ...input };
}

export function archiveCustomerCommand(
  input: Omit<ArchiveCustomerCommand, "type">,
): ArchiveCustomerCommand {
  return { type: "ArchiveCustomer", ...input };
}

export function restoreCustomerCommand(
  input: Omit<RestoreCustomerCommand, "type">,
): RestoreCustomerCommand {
  return { type: "RestoreCustomer", ...input };
}

export function mergeCustomerCommand(
  input: Omit<MergeCustomerCommand, "type">,
): MergeCustomerCommand {
  return { type: "MergeCustomer", ...input };
}
