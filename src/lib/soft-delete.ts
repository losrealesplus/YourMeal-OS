/**
 * Soft-delete helpers for Services.
 * @see docs/adr/0006-soft-delete-audit.md
 * Identity Hardening: profiles / memberships / employee_profiles use deleted_at + deleted_by.
 */

export function isActiveRow(row: { deleted_at?: string | null }): boolean {
  return row.deleted_at == null;
}

export function softDeletePatch(at: Date = new Date()) {
  return { deleted_at: at.toISOString() };
}

export function softArchivePatch(actorId: string, at: Date = new Date()) {
  return {
    deleted_at: at.toISOString(),
    deleted_by: actorId,
  };
}
