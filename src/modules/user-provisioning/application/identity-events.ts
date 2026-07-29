/**
 * Writes identity_events (business audit). Complements audit_log (technical).
 */
import type { IdentityEventType } from "../domain/hardening";

export type IdentityEventInput = {
  tenantId?: string | null;
  userId?: string | null;
  membershipId?: string | null;
  eventType: IdentityEventType;
  performedBy?: string | null;
  metadata?: Record<string, unknown>;
  performedAt?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function recordIdentityEvent(
  admin: any,
  input: IdentityEventInput,
): Promise<void> {
  const { error } = await admin.from("identity_events").insert({
    tenant_id: input.tenantId ?? null,
    user_id: input.userId ?? null,
    membership_id: input.membershipId ?? null,
    event_type: input.eventType,
    performed_by: input.performedBy ?? null,
    performed_at: input.performedAt ?? new Date().toISOString(),
    metadata: input.metadata ?? {},
  });
  if (error) {
    // Never block primary flow on audit failure — but surface in logs
    console.error("[identity_events]", error.message, input.eventType);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function recordIdentityEvents(
  admin: any,
  events: IdentityEventInput[],
): Promise<void> {
  for (const event of events) {
    await recordIdentityEvent(admin, event);
  }
}
