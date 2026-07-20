/**
 * Soft-delete helpers for Services.
 * @see docs/adr/0006-soft-delete-audit.md
 */

export function isActiveRow(row: { deleted_at?: string | null }): boolean {
  return row.deleted_at == null;
}

export function softDeletePatch(at: Date = new Date()) {
  return { deleted_at: at.toISOString() };
}
