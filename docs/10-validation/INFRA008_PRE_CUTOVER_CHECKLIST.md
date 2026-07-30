# INFRA-008 · PRE-CUTOVER CHECKLIST
## Prepare `djangucecsphnejplvic` (Project B) for Lovable cutover

**Fecha:** 2026-07-29  
**Alcance:** Schema / storage / seeds checklist — **no** data migration · **no** Lovable · **no** env · **no** Auth/Identity/Flow code  

**Pre-check:** PR #107 MERGED · objetivo = preparar B como único backend (sin migrar datos aún)

---

## Método

- Esperado = `supabase/migrations/*.sql` + código (`tenant-branding`)
- Observado = REST/Storage con publishable de B (sin `SERVICE_ROLE`)
- 404 = tabla ausente en schema cache · 401 = existe + RLS

---

## Migraciones

| Estado | Detalle |
|--------|---------|
| En repo | 29+ archivos bajo `supabase/migrations/` |
| Aplicadas en B (inferido) | Núcleo OK (34 tablas visibles vía REST ≠ 404) |
| **Pendientes de aplicar en B** | Migraciones que crean tablas hoy **404** en B (archivos **ya existen**, no regenerar): |

1. `20260728210000_accounting_invoice_orders.sql` → `invoice_orders`  
2. `20260728220000_accounting_review_period_close.sql` → `financial_period_closures`  
3. `20260729100000_identity_membership_lifecycle.sql` → `user_invitations`, `employee_profiles`  
4. `20260729120000_identity_hardening_v1.sql` → `identity_events` (+ altera invitations/profiles)  
5. **Nueva (INFRA-008):** `20260729184500_infra008_tenant_branding_bucket.sql` → bucket `tenant-branding`

**Acción operador (fuera de este agente):**  
`supabase link --project-ref djangucecsphnejplvic` → `supabase db push` (o Dashboard SQL) hasta que las 5 tablas dejen de ser 404 y el bucket exista.

---

## Buckets

| Bucket | Esperado | Live B | Acción |
|--------|----------|--------|--------|
| `tenant-branding` (privado) | Sí (policies + branding repo) | **Ausente** (`[]`) | Migration INFRA-008 generada |

Otros buckets: **no requeridos** por migraciones actuales.

---

## Seeds

| Seed | Estado |
|------|--------|
| EatClean / feature_flags / platform_owners (migrations OP-002) | Históricamente aplicados en B (OP-002 evidence) |
| Seed **nuevo** para cutover | **No generado** — no migrar datos A→B aquí |
| Re-verificación | Operador: confirmar `platform_owners` + tenant `eatclean-tenerife` tras `db push` |

---

## Policies / Functions / Triggers

| Objeto | Esperado (repo) | Live B (publishable) |
|--------|-----------------|----------------------|
| RLS policies | Definidas en migrations | Comportamiento OK en tablas existentes (401 donde corresponde) · **inventario SQL completo UNVERIFIED** sin service_role |
| Functions (20) | En migrations | `current_user_tenants` / `ensure_platform_owner_session` → 401 (existen) · resto firmas con args → PGRST202 (no prueba ausencia) |
| Triggers (8) | En migrations | **UNVERIFIED** en vivo · se aplican con las migrations pendientes |

No se inventaron policies/functions/triggers nuevos.

---

## Datos mínimos

| Dato | Estado |
|------|--------|
| Tablas legibles anon | count **0** (OK para prep; no es migración de datos) |
| Platform owners / tenant | Evidencia OP-002 en B — revalidar tras push |
| Copiar desde A | **Fuera de alcance** |

---

## Riesgos

| Riesgo | Nota |
|--------|------|
| `db push` falla a mitad | Aplicar en orden por timestamp; no saltar `identity_hardening` |
| Bucket sin policies | Policies ya en `20260723174724_*` — aplicar historial completo |
| Types desalineados | `types.ts` en main puede no listar tablas nuevas — `gen:types` **después** del push (operador) |
| Site URL / SMTP / Redirects | INFRA-006 — **no** configurados aquí |

---

## Rollback

1. No revertir migrations aplicadas en B sin backup.  
2. Bucket: `DELETE FROM storage.buckets WHERE id = 'tenant-branding';` solo si vacío.  
3. Revertir commit INFRA-008 del repo si el SQL del bucket no debe existir aún.

---

## Checklist operador

```text
□ supabase link --project-ref djangucecsphnejplvic
□ supabase db push  (incluye 2821/2822/2910/2912 + INFRA-008 bucket)
□ Verificar tablas: invoice_orders, financial_period_closures,
  user_invitations, employee_profiles, identity_events  → no 404
□ Verificar bucket tenant-branding existe
□ Revalidar seeds OP-002 (owners + tenant)
□ (Fuera INFRA-008) Site URL + Redirects + publishable en Lovable Cloud
```

---

## Resultado INFRA-008

| Campo | Valor |
|-------|--------|
| Migraciones pendientes | 4 archivos existentes + 1 bucket nuevo (aplicar en B) |
| Buckets pendientes | `tenant-branding` |
| Seeds pendientes | Ninguno nuevo (revalidar OP-002) |
| Configuración pendiente | Site URL / Redirects / Lovable keys (fuera de alcance) |
| ¿B listo para conectar Lovable? | **NO** hasta `db push` + bucket |
