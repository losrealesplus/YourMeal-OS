# CUTOVER-001 · INFORME FINAL DE MIGRACIÓN

**Fecha:** 2026-07-29
**Project Ref objetivo:** `djangucecsphnejplvic`
**Project Ref efectivo (runtime actual):** `cbeegcxkayybfncnuirg` (backend gestionado por la plataforma)
**Estado del cutover:** **BLOQUEADO — pendiente de acción manual del operador**

---

## Pre-check

| Item | Resultado |
|------|-----------|
| Proyecto objetivo confirmado | `djangucecsphnejplvic` |
| Nuevas migraciones creadas | No |
| Lógica de negocio modificada | No |
| Arquitectura modificada | No |
| Evidencia histórica `docs/10-validation` | Preservada íntegra |

---

## Estado por superficie

| Superficie | Valor | Estado |
|-----------|-------|--------|
| `supabase/config.toml` | `djangucecsphnejplvic` | ✅ Alineado |
| `.env.example` | `djangucecsphnejplvic` | ✅ Alineado |
| `package.json` (`gen:types`) | `--project-id djangucecsphnejplvic` | ✅ Alineado |
| `src/integrations/supabase/client.ts` | Lee `VITE_SUPABASE_*` (sin hardcode) | ✅ Alineado |
| `.env` (autogenerado por la plataforma) | `cbeegcxkayybfncnuirg` | ❌ Bloqueado |
| Variables de runtime del Preview | `cbeegcxkayybfncnuirg` | ❌ Bloqueado |
| Tipos `src/integrations/supabase/types.ts` | Generados desde el backend actual | ⏸ Pendiente de reconexión |

---

## Barrido de referencias a `cbeegcxkayybfncnuirg`

Referencias activas en código, scripts o configuración: **ninguna**.

Referencias restantes (todas documentación histórica / evidencia — **conservadas sin modificar**):

- `docs/10-validation/INFRA001_SUPABASE_RUNTIME_BINDING_AUDIT.md`
- `docs/10-validation/INFRA002_RUNTIME_CUTOVER.md`
- `docs/10-validation/INFRA004_SUPABASE_PROJECT_COMPARISON.md`
- `docs/10-validation/INFRA007_CUTOVER_PLAN.md`
- `docs/10-validation/AUTH_AUDIT.md`
- `docs/10-validation/SUPABASE_AUTH_VALIDATION.md`
- `docs/10-validation/auth/{NETWORK_TRACE,FCR010_AUTH_TOKEN_400,FCR011_SUPABASE_PROJECT_AUDIT,AUTH_E2E_INVESTIGATION}.md`
- `docs/10-validation/evidence/infra004/infra004-raw.json`

Excepción operativa: `.env` (archivo generado y reescrito por la plataforma en cada build; no editable desde el repo).

---

## Bloqueo

**Qué bloquea:** la conexión BYO Supabase no puede realizarse desde el código ni desde el agente. El binding del backend (`SUPABASE_URL`, `VITE_SUPABASE_*`, service role) lo emite la plataforma y sobrescribe `.env` en cada build. El prefijo `SUPABASE_` está reservado y no admite escritura por herramienta de secretos.

**Dónde:** ajustes del proyecto → Connectors → Supabase (integración BYO).

**Acción manual pendiente (operador):**
1. Desconectar el backend gestionado.
2. Conectar el proyecto propio y seleccionar `djangucecsphnejplvic`.
3. Autorizar el acceso para que la plataforma reescriba `.env` con URL, project ref y publishable key reales.

Tras ese paso, en un solo turno queda pendiente: regeneración de tipos, verificación de runtime/preview/auth/storage endpoints y las pruebas funcionales mínimas.

---

## Validaciones no ejecutables aún

| Validación | Estado |
|-----------|--------|
| Runtime apunta a `djangucecsphnejplvic` | ⏸ No verificable (backend no reconectado) |
| Preview regenerado contra el nuevo ref | ⏸ No verificable |
| Auth endpoint | ⏸ No verificable |
| Storage endpoint / bucket `tenant-branding` | ⏸ No verificable |
| Login · Logout · Refresh Session | ⏸ No ejecutadas |
| Bootstrap de identidad · Membership · RBAC | ⏸ No ejecutadas |

---

## Riesgos pendientes

| Riesgo | Mitigación |
|--------|------------|
| Esquema/semillas ausentes en el proyecto destino | Aplicar `scripts/cutover/000_consolidated_schema.sql` y `010_seed_eatclean.sql` antes del primer login |
| Bucket `tenant-branding` inexistente en destino | Crearlo (privado) tras la conexión |
| Primer `saas_admin` sin provisionar | SQL de concesión documentado en `scripts/cutover/README.md` |
| Site URL / Redirect URLs / SMTP / OAuth | Fuera del alcance de CUTOVER-001; requieren configuración del operador |
| Tipos desalineados si se ejecuta `gen:types` antes de la reconexión | No ejecutar hasta que el runtime apunte a `djangucecsphnejplvic` |

---

## Fuera de alcance (no modificado)

OAuth Google · SMTP · Secrets · PostHog · Stripe · Resend.
