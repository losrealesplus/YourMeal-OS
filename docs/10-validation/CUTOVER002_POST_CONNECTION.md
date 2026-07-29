# CUTOVER-002 · VALIDACIÓN POST-CONEXIÓN

**Fecha:** 2026-07-29
**Project Ref objetivo:** `djangucecsphnejplvic`
**Project Ref efectivo (runtime):** `cbeegcxkayybfncnuirg`
**Estado:** **PRE-CHECK FALLIDO — validación no ejecutada**

---

## Pre-check

La condición de entrada («el runtime de Lovable ya está conectado a `djangucecsphnejplvic`») **no se cumple**. Evidencia recogida sin modificar nada:

| Fuente | Valor observado |
|--------|-----------------|
| `.env` → `SUPABASE_PROJECT_ID` | `cbeegcxkayybfncnuirg` |
| `.env` → `SUPABASE_URL` | `https://cbeegcxkayybfncnuirg.supabase.co` |
| `.env` → `VITE_SUPABASE_PROJECT_ID` | `cbeegcxkayybfncnuirg` |
| `.env` → `VITE_SUPABASE_URL` | `https://cbeegcxkayybfncnuirg.supabase.co` |
| `.env` → `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_BXBa…` (pertenece al proyecto legacy) |
| `printenv` (proceso del dev server) | `SUPABASE_URL` / `VITE_SUPABASE_URL` → `cbeegcxkayybfncnuirg` |

El backend sigue siendo el gestionado por la plataforma. La integración BYO Supabase hacia `djangucecsphnejplvic` no se ha realizado.

---

## Verificaciones

| # | Verificación | Resultado |
|---|--------------|-----------|
| 1 | Runtime (Project Ref / URL / Publishable Key) | ❌ Resuelven a `cbeegcxkayybfncnuirg` |
| 2 | Regeneración de tipos (`gen:types`) | ⏸ **No ejecutada deliberadamente.** El script apunta a `--project-id djangucecsphnejplvic`; ejecutarlo ahora generaría tipos de un proyecto distinto al del runtime, rompiendo la coherencia tipos↔datos |
| 3 | Preview sin errores | ⚠️ Arranca, pero contra el proyecto legacy — no valida el cutover |
| 4 | Login · Logout · Refresh Session · Bootstrap de identidad · Membership · RBAC · Storage `tenant-branding` | ⏸ No ejecutadas: cualquier resultado sería del proyecto legacy y no constituye evidencia de cutover |
| 5 | Referencias activas a `cbeegcxkayybfncnuirg` | ✅ **0** en código, scripts y configuración del repo |

### Detalle de la verificación 5

Referencias restantes (todas documentación histórica / evidencia — **conservadas sin modificar**):

- `docs/10-validation/CUTOVER001_FINAL_REPORT.md`
- `docs/10-validation/INFRA001_SUPABASE_RUNTIME_BINDING_AUDIT.md`
- `docs/10-validation/INFRA002_RUNTIME_CUTOVER.md`
- `docs/10-validation/INFRA004_SUPABASE_PROJECT_COMPARISON.md`
- `docs/10-validation/INFRA007_CUTOVER_PLAN.md`
- `docs/10-validation/AUTH_AUDIT.md`
- `docs/10-validation/SUPABASE_AUTH_VALIDATION.md`
- `docs/10-validation/auth/{NETWORK_TRACE,AUTH_E2E_INVESTIGATION,FCR010_AUTH_TOKEN_400,FCR011_SUPABASE_PROJECT_AUDIT}.md`
- `docs/10-validation/evidence/infra004/infra004-raw.json`

Excepción operativa conocida: `.env`, archivo generado y reescrito por la plataforma en cada build; no editable desde el repositorio.

---

## Estado del repositorio (sin cambios en este turno)

| Superficie | Valor | Estado |
|-----------|-------|--------|
| `supabase/config.toml` | `djangucecsphnejplvic` | ✅ Alineado |
| `.env.example` | `djangucecsphnejplvic` | ✅ Alineado |
| `package.json` (`gen:types`) | `djangucecsphnejplvic` | ✅ Alineado |
| `src/integrations/supabase/client.ts` | Lee `VITE_SUPABASE_*`, sin hardcode | ✅ Alineado |

---

## Bloqueo y acción manual pendiente

**Qué bloquea:** la conexión BYO Supabase no se puede ejecutar desde el código ni desde el agente. `.env` y las variables de runtime las emite y sobrescribe la plataforma; el prefijo `SUPABASE_` es reservado.

**Dónde:** ajustes del proyecto → Connectors → Supabase.

**Pasos del operador:**
1. Desconectar el backend gestionado.
2. Conectar el proyecto propio y seleccionar `djangucecsphnejplvic`.
3. Autorizar el acceso para que se reescriban URL, project ref y publishable key.

Tras ese paso, CUTOVER-002 es reejecutable en un solo turno: regeneración de tipos, verificación de runtime/preview/auth/storage y las 7 pruebas funcionales.

---

## Riesgos pendientes

| Riesgo | Mitigación |
|--------|------------|
| Esquema/semillas ausentes en el proyecto destino | Aplicar `scripts/cutover/000_consolidated_schema.sql` y `010_seed_eatclean.sql` antes del primer login |
| Bucket `tenant-branding` inexistente en destino | Crearlo (privado) tras la conexión |
| Primer `saas_admin` sin provisionar | SQL documentado en `scripts/cutover/README.md` |
| `gen:types` ejecutado antes de la reconexión | Genera tipos de un proyecto distinto al runtime — no ejecutar hasta el cutover efectivo |

---

## Fuera de alcance (no modificado)

OAuth Google · SMTP · Secrets · PostHog · Stripe · Resend · código de negocio · migraciones.
