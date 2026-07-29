/**
 * P9 · Bulk operations — architecture stubs only.
 * Do NOT implement CSV import / mass invite here.
 * Future services can call the same single-item domain + identity_events pipeline.
 *
 * FUTURE: inviteManyEmployees, suspendMany, reactivateMany, assignRoleMany
 */

import type { MembershipType, ProvisioningChannel } from "./lifecycle";
import type { IdentityEventType } from "./hardening";

export type BulkInviteDraft = {
  emails: string[];
  membershipType: MembershipType;
  channel: Extract<ProvisioningChannel, "invitation" | "provisioning">;
  intendedRole?: string | null;
};

export type BulkMembershipAction = {
  membershipIds: string[];
  action: "suspend" | "reactivate" | "revoke" | "approve";
};

export type BulkRoleAssignment = {
  membershipIds: string[];
  role: string;
};

/**
 * Validates bulk draft shape without performing I/O.
 * Caps protect accidental mega-batches until a dedicated worker exists.
 */
export function validateBulkInviteDraft(
  draft: BulkInviteDraft,
  maxBatch = 50,
): { ok: true } | { ok: false; code: string; message: string } {
  if (!draft.emails.length) {
    return { ok: false, code: "BULK_EMPTY", message: "No emails provided" };
  }
  if (draft.emails.length > maxBatch) {
    return {
      ok: false,
      code: "BULK_TOO_LARGE",
      message: `Batch exceeds max ${maxBatch} — use async worker when implemented`,
    };
  }
  return { ok: true };
}

export function validateBulkMembershipAction(
  draft: BulkMembershipAction,
  maxBatch = 50,
): { ok: true } | { ok: false; code: string; message: string } {
  if (!draft.membershipIds.length) {
    return { ok: false, code: "BULK_EMPTY", message: "No membership ids" };
  }
  if (draft.membershipIds.length > maxBatch) {
    return {
      ok: false,
      code: "BULK_TOO_LARGE",
      message: `Batch exceeds max ${maxBatch}`,
    };
  }
  return { ok: true };
}

/** Planned identity events for a successful single invite (documentation for bulk). */
export const BULK_INVITE_EVENT_SEQUENCE: IdentityEventType[] = [
  "USER_REGISTERED",
  "PROFILE_CREATED",
  "MEMBERSHIP_CREATED",
  "INVITATION_SENT",
];

/**
 * Marker interface — implement later without rewriting architecture.
 * @future BulkUserProvisioningService
 */
export type BulkUserProvisioningPort = {
  inviteMany(draft: BulkInviteDraft): Promise<{ accepted: number; rejected: number }>;
  suspendMany(draft: BulkMembershipAction): Promise<{ updated: number }>;
  reactivateMany(draft: BulkMembershipAction): Promise<{ updated: number }>;
  assignRoleMany(draft: BulkRoleAssignment): Promise<{ updated: number }>;
};
