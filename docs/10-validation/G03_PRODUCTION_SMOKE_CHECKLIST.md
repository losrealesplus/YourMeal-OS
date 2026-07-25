# G-03 · Production Smoke Checklist

**Gate:** [G-03 · Platform Operational Baseline](../20-evidence-framework/10-gate-g03-platform-operational-baseline.md)  
**Official project:** `djangucecsphnejplvic`  
**Objetivo:** Demostrar E2E que DB + Auth + App operan como un sistema único.  
**No es:** desarrollo de features · no modificar código salvo hotfix bloqueante documentado.

**Evidencia:** `docs/10-validation/evidence/g03/` (crear al ejecutar).

---

## 0 · Prerrequisitos (bloqueo duro)

| # | Item | ☐ |
|---|------|---|
| 0.1 | Publishable key del proyecto oficial en `.env` | ☐ |
| 0.2 | Mismas vars en Lovable Cloud (Preview + Production) | ☐ |
| 0.3 | `VITE_SUPABASE_URL` = `https://djangucecsphnejplvic.supabase.co` | ☐ |
| 0.4 | `supabase link --project-ref djangucecsphnejplvic` OK (CLI local) | ☐ |
| 0.5 | `npm run gen:types` ejecutado y commitido si hubo drift | ☐ |
| 0.6 | Platform Owner Auth user existe (allowlist OP-002) | ☐ |

Si 0.x falla → **G-03 BLOCKED**. No continuar smoke de UI.

---

## 1 · Supabase (plataforma)

| # | Check | Result | EV |
|---|-------|--------|-----|
| 1.1 | Studio: tablas núcleo visibles | | EV-G03-01 |
| 1.2 | RLS enabled en tablas `public` de negocio | | |
| 1.3 | RPC `ensure_platform_owner_session` existe | | |
| 1.4 | `platform_owners` tiene filas activas | | |
| 1.5 | Storage bucket(s) accesibles según config | | |
| 1.6 | Realtime conecta (subscription smoke o presence) | | |

---

## 2 · Login

| Rol | Ruta | Result | Notas |
|-----|------|--------|-------|
| Platform Owner | `/auth/admin` o flujo documentado | ☐ | Tras login: roles `saas_admin` + `company_admin` esperados |
| Company Admin | `/auth/admin` | ☐ | Acceso Ops |
| Customer | `/auth` | ☐ | Landing `/app` |

| # | Check | ☐ |
|---|-------|---|
| 2.1 | Logout limpia sesión | ☐ |
| 2.2 | Refresh mantiene sesión | ☐ |
| 2.3 | Ruta protegida sin sesión → redirect auth | ☐ |

---

## 3 · Gestión SaaS

Tras login Platform Owner / `saas_admin`:

| Superficie | Visible / carga | Sin error bloqueante | EV |
|------------|-----------------|----------------------|-----|
| Entry SaaS / Brand leaf → `/saas` | ☐ | ☐ | EV-G03-SAAS |
| Empresas / tenants | ☐ | ☐ | |
| Usuarios / roles (lectura) | ☐ | ☐ | |
| Configuración / tenant | ☐ | ☐ | |

Si no hay datos: **no asumir bug de React** — verificar seed, RLS, RPC, `user_roles` (ver §5–6).

---

## 4 · Gestión Operaciones

| Superficie | Visible / carga | Sin error bloqueante | EV |
|------------|-----------------|----------------------|-----|
| `/admin` Dashboard | ☐ | ☐ | EV-G03-OPS |
| Pedidos | ☐ | ☐ | |
| Producción / Cocina | ☐ | ☐ | |
| Estados / transiciones (si hay datos) | ☐ | ☐ | |
| Empresas (vista ops) | ☐ | ☐ | |

---

## 5 · Consola / Network

En DevTools (sesión autenticada relevante):

| Clase de error | Ausente | Si presente → investigar |
|----------------|---------|--------------------------|
| 401 | ☐ | Auth / key / proyecto equivocado |
| 403 | ☐ | RLS / grants / rol |
| 404 (RPC/tabla) | ☐ | Types drift / migración no aplicada |
| 500 | ☐ | RPC / SQL |
| Error init Supabase client | ☐ | Env vacía / Lovable desalineado |
| React Query hard-fail en shells SaaS/Ops | ☐ | Repo / RLS / RPC |

Registrar HAR o captura Network limpia: `evidence/g03/network-*.png` o `.har`.

---

## 6 · Base de datos (desde app + Studio)

| Check | ☐ |
|-------|---|
| Lecturas PostgREST con JWT autenticado OK | ☐ |
| RPC de sesión / dominio responden | ☐ |
| Policies no bloquean Owner/Admin legítimo | ☐ |
| Storage upload/read smoke (si aplica branding) | ☐ |

---

## 7 · Evidencia mínima (capturas)

| Artefacto | Path sugerido | ☐ |
|-----------|---------------|---|
| Login | `evidence/g03/01-login.png` | ☐ |
| Dashboard Ops | `evidence/g03/02-ops-dashboard.png` | ☐ |
| Gestión SaaS | `evidence/g03/03-saas.png` | ☐ |
| Gestión Operaciones | `evidence/g03/04-ops-shell.png` | ☐ |
| Network limpio | `evidence/g03/05-network.png` | ☐ |
| Acta decisión | `evidence/g03/ACTA_G03.md` | ☐ |

---

## Decisión

| Campo | Valor |
|-------|-------|
| Fecha | |
| Ejecutor | |
| Commit SHA | |
| Deployment / Preview ID | |
| **G-03** | ☐ PASS · ☐ BLOCKED |
| Bloqueos (si BLOCKED) | |

Al **PASS**: anotar hito en [MILESTONES](../00-status/MILESTONES.md) y reanudar módulos funcionales.

Al **BLOCKED**: abrir hallazgo puntual (RLS / seed / env) — **no** empezar CAP nueva.
