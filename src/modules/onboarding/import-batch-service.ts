/**
 * B3.7E H-3 — Import Batch Service
 *
 * Wraps onboarding imports as a single logical unit with a durable batch_id.
 * The audit_log entry is the "commit token": if it doesn't exist, the batch is incomplete
 * and can be safely cleaned up by batch_id.
 *
 * Atomicity model (Supabase REST, no DDL transactions):
 *   1. All dishes/menus/slots carry macros.source_trace.import_batch_id
 *   2. The audit_log entry is inserted as the LAST step — before returning success
 *   3. If any step fails → rollback deletes all rows with that batch_id
 *   4. Idempotency: if audit_log entry exists for batch_id → import already committed
 */

export interface ImportBatchParams {
  tenantId: string;
  actorId: string;
  sourceFile: string;
  sourceFileSha256: string;
  batchId: string;
}

export interface ImportBatchResult {
  batchId: string;
  dishesInserted: number;
  menusInserted: number;
  slotsInserted: number;
  auditCommitted: boolean;
}

export interface ImportBatchRollbackSummary {
  batchId: string;
  dishesDeleted: number;
  menusDeleted: number;
  slotsDeleted: number;
  reason: string;
}

/**
 * Checks whether a batch_id has already been committed (idempotency gate).
 * If it has, a re-import of the same file will be blocked at the caller.
 */
export async function isImportBatchCommitted(
  supabaseUrl: string,
  serviceKey: string,
  batchId: string,
): Promise<boolean> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/audit_log?entity_id=eq.${batchId}&action=like.onboarding.*`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
  );
  const data = await res.json() as unknown[];
  return Array.isArray(data) && data.length > 0;
}

/**
 * Rollback: deletes all data rows tagged with batchId.
 * Called on any step failure during the import transaction.
 */
export async function rollbackImportBatch(
  supabaseUrl: string,
  serviceKey: string,
  tenantId: string,
  batchId: string,
  reason: string,
): Promise<ImportBatchRollbackSummary> {
  const hdr = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "count=exact",
  };
  const base = `${supabaseUrl}/rest/v1`;

  // Count then delete slots linked to menus with this batchId tag
  // Slots reference dishes — but dishes are the canonical tagged entity
  // Delete in reverse dependency order: slots → menus → dishes

  // Slots: cascade deletes when menus are deleted; but clean explicitly for safety
  const slotMenuIds = await fetch(
    `${base}/weekly_menus?select=id&macros->>import_batch_id=eq.${batchId}`,
    { headers: hdr }
  ).then(r => r.json()).then((rows: { id: string }[]) => rows.map(r => r.id));

  let slotsDeleted = 0;
  for (const menuId of slotMenuIds) {
    const dr = await fetch(
      `${base}/weekly_menu_slots?weekly_menu_id=eq.${menuId}`,
      { method: "DELETE", headers: hdr }
    );
    const cr = dr.headers.get("content-range");
    slotsDeleted += cr ? parseInt(cr.split("/")[1] ?? "0", 10) : 0;
  }

  const menusRes = await fetch(
    `${base}/weekly_menus?macros->>import_batch_id=eq.${batchId}`,
    { method: "DELETE", headers: hdr }
  );
  const menusCr = menusRes.headers.get("content-range");
  const menusDeleted = menusCr ? parseInt(menusCr.split("/")[1] ?? "0", 10) : 0;

  // Dishes tagged with this batch in source_trace
  const dishesRes = await fetch(
    `${base}/dishes?tenant_id=eq.${tenantId}`,
    {
      method: "GET",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    }
  );
  const allDishes = await dishesRes.json() as Array<{ id: string; macros: { source_trace?: { import_batch_id?: string } } }>;
  const batchDishIds = allDishes
    .filter(d => d.macros?.source_trace?.import_batch_id === batchId)
    .map(d => d.id);

  let dishesDeleted = 0;
  if (batchDishIds.length > 0) {
    for (let i = 0; i < batchDishIds.length; i += 50) {
      const chunk = batchDishIds.slice(i, i + 50);
      const dr = await fetch(
        `${base}/dishes?id=in.(${chunk.join(",")})`,
        { method: "DELETE", headers: hdr }
      );
      const cr = dr.headers.get("content-range");
      dishesDeleted += cr ? parseInt(cr.split("/")[1] ?? "0", 10) : 0;
    }
  }

  console.error(`[ImportBatch] ROLLBACK batchId=${batchId} reason="${reason}"`, {
    dishesDeleted, menusDeleted, slotsDeleted,
  });

  return { batchId, dishesDeleted, menusDeleted, slotsDeleted, reason };
}

/**
 * Commits the import batch by writing the audit_log entry.
 * This is the FINAL step — its existence proves the batch is complete.
 */
export async function commitImportBatch(
  supabaseUrl: string,
  serviceKey: string,
  params: ImportBatchParams,
  result: { dishesInserted: number; menusInserted: number; slotsInserted: number; sourceSlotsReconciled: number },
): Promise<void> {
  const hdr = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
  const res = await fetch(`${supabaseUrl}/rest/v1/audit_log`, {
    method: "POST",
    headers: hdr,
    body: JSON.stringify({
      tenant_id: params.tenantId,
      actor_id: params.actorId,
      entity_type: "import_batch",
      entity_id: params.batchId,
      action: "onboarding.menu_and_dish_import",
      new_data: {
        source_file: params.sourceFile,
        source_file_sha256: params.sourceFileSha256,
        dishes_imported: result.dishesInserted,
        weekly_menus_imported: result.menusInserted,
        menu_slots_imported: result.slotsInserted,
        source_slots_reconciled: result.sourceSlotsReconciled,
        timestamp: new Date().toISOString(),
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Import batch commit failed (audit_log write): ${res.status} ${body}`);
  }
}
