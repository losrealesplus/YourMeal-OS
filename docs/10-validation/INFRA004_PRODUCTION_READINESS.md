# INFRA-004 · Production Readiness

**Tipo:** Epic de cierre de infraestructura (no feature)  
**Fecha:** 2026-07-25  
**Estado:** OPEN — bloqueado por cutover keys + Dashboard Auth + smoke  
**Proyecto Supabase oficial:** `djangucecsphnejplvic`  
**URL:** `https://djangucecsphnejplvic.supabase.co`

---

## Objetivo

Cerrar completamente el bloque de infraestructura de YourMeal OS **antes** de abrir módulos funcionales nuevos (Pedidos, Cocina, SaaS ampliados, etc.).

Al cerrar INFRA-004:

1. Todo el runtime apunta solo a `djangucecsphnejplvic`.
2. OAuth Google/Apple funciona vía Supabase Auth nativo (INFRA-003).
3. localhost, Lovable Preview y producción pasan smoke.
4. PRs de infra fusionados y tag de baseline creado.

---

## Secuencia obligatoria (no invertir)

```text
INFRA-002 Cutover (.env + Cloud + keys)
        ↓
INFRA-003 Auth Migration (PR #68) — código ya listo
        ↓
INFRA-004 Production Readiness (este epic)
        ↓
Tag v0.2.0-auth-complete
        ↓
Reanudar desarrollo funcional
```

| Epic | PR | Rol |
|------|-----|-----|
| INFRA-002 | [#66](https://github.com/losrealesplus/YourMeal-OS/pull/66) | Binding al proyecto oficial (refs + plantilla `.env`) |
| INFRA-002.1 | Doc | Cómo Lovable lee `VITE_*` / Cloud Connect |
| INFRA-003 | [#68](https://github.com/losrealesplus/YourMeal-OS/pull/68) | Auth nativo Supabase; sin `cloud-auth-js` |
| INFRA-004 | Este doc + checklist | Dashboard + OAuth E2E + smoke + merge + tag |

**Orden de merge recomendado:** `#66` (con publishable reales pegadas) → `#68` → cerrar checklist INFRA-004 → tag.

Si se mergea `#68` antes de `#66`, el código Auth es correcto pero Preview seguirá en legacy hasta cutover de `.env`.

---

## Fase 1 — Supabase Dashboard

**Owner:** operador (no automatizable sin Management API token).

### 1.1 Providers

Dashboard → [Authentication → Providers](https://supabase.com/dashboard/project/djangucecsphnejplvic/auth/providers)

| Provider | Acción |
|----------|--------|
| Google | Enabled + Client ID + Client Secret (Google Cloud Console) |
| Apple | Enabled + config Apple si se ofrece en UI |
| Email | Enabled (password / magic link según producto) |
| Phone | Solo si se mantiene pestaña SMS en `/auth` |

### 1.2 URL Configuration

Dashboard → Authentication → URL Configuration

| Campo | Valor |
|-------|-------|
| Site URL | `https://eatcleanapp.lovable.app` (o host canónico definitivo) |
| Redirect URLs | ver lista abajo |

Redirect URLs mínimas:

```text
http://localhost:8080/auth/callback
http://localhost:5173/auth/callback
https://eatcleanapp.lovable.app/auth/callback
https://eatcleanapp.lovable.app/reset-password
```

Añadir cualquier dominio definitivo adicional (custom domain, preview hosts estables).

> El puerto de Vite local puede variar; confirmar el puerto real del `npm run dev` del repo y allowlist ese origin.

### 1.3 Evidencia Fase 1

```text
□ Screenshot Providers (Google ON)
□ Screenshot URL Configuration (callbacks listados)
□ Sin inventar Client ID/Secret en el repo
```

---

## Fase 2 — Validación OAuth

Flujo esperado (Network):

```text
/auth → botón Google
  → https://djangucecsphnejplvic.supabase.co/auth/v1/authorize?...
  → accounts.google.com
  → Supabase callback
  → https://<app-host>/auth/callback?code=...
  → exchangeCodeForSession (SDK)
  → sesión en localStorage
  → resolveHomePath → /app | /admin | …
```

**FAIL inmediato si aparece:** `/{anything}/~oauth/initiate` o host `cbeegcxkayybfncnuirg`.

Checklist detallado: [INFRA004_PRODUCTION_READINESS_CHECKLIST.md](./checklists/INFRA004_PRODUCTION_READINESS_CHECKLIST.md) §B.

---

## Fase 3 — Validación runtime (tres superficies)

| Superficie | Qué verificar |
|------------|----------------|
| localhost | `.env` oficial + Google login + callback + sesión |
| Lovable Preview | Git sync del `.env` + Cloud Connect al proyecto oficial + rebuild |
| Producción (`eatcleanapp.lovable.app` u host final) | Mismo host en Site URL + Redirect URLs + login real |

Lovable:

- Frontend keys van en **`.env` committed** (`VITE_*`) — Secrets UI rechaza `VITE_*`.
- More → Cloud → Connect Supabase → `djangucecsphnejplvic`.
- Ver [INFRA002_1_LOVABLE_ENV_CUTOVER.md](./INFRA002_1_LOVABLE_ENV_CUTOVER.md).

---

## Fase 4 — Smoke Test (portales)

Mínimo PASS:

| Portal / dominio | Check |
|------------------|-------|
| Cliente | Login → menú/home `/app` |
| Admin / Ops | `/auth/admin` → staff → `/admin` |
| Kitchen | Ruta kitchen accesible con rol |
| Driver | Ruta driver con rol |
| Platform Owner | Ensure session + SaaS o Ops según roles |
| Tenant | Membership / branding scope |
| RBAC | Sin rol → redirect; revoke → pierde acceso |
| Localization | Cambio ES/EN persistido |

Complementa: [INFRA003 checklist](./checklists/INFRA003_AUTH_MIGRATION_CHECKLIST.md) + G-03 si aplica.

---

## Fase 5 — Cerrar PRs

```text
□ Pegar publishable reales en branch INFRA-002 (hoy keys vacías en #66)
□ Merge PR #66 → main
□ Merge PR #68 → main (Auth nativo)
□ Confirmar main: cero refs operativas a cbeegcxkayybfncnuirg en .env / config.toml
□ Cerrar o rebasear PRs docs satélite (p.ej. #67 G-03) según necesidad
```

**No** force-push / rebase de historia publicada en Lovable.

---

## Fase 6 — Tag

Tras PASS de Fases 1–5:

```bash
git checkout main
git pull origin main
git tag -a v0.2.0-auth-complete -m "INFRA-002/003/004: official Supabase + native Auth baseline"
git push origin v0.2.0-auth-complete
```

Significado del tag: baseline de infraestructura Auth+binding, no release de producto completo.

---

## Inventario residual INFRA-002 (evidencia 2026-07-25)

| Superficie | Estado en `main` | Estado en PR #66 |
|------------|------------------|------------------|
| `.env` project ref | **legacy** `cbeegcxkayybfncnuirg` | oficial `djangucecsphnejplvic` |
| `.env` publishable | legacy key presente | **vacía** — operador debe pegar |
| `.env.local` / `.env.production` | no existen en repo | N/A |
| `supabase/config.toml` | legacy | oficial |
| Código `src/` hardcode ref | ausente | ausente |
| GitHub Actions secrets Supabase | workflow bootstrap usa DB local — sin secret de proyecto remoto | N/A |
| Vercel / Netlify app deploy | no hay workflow de deploy en repo | N/A (deps transitivas npm irrelevantes) |
| Lovable Cloud Connect | operador | operador |
| Service role | no en `.env` (correcto) | solo local/scripts |

**Gate cutover:** cero referencias operativas a `cbeegcxkayybfncnuirg` en archivos de binding (`.env*`, `config.toml`) del branch publicado + Network host oficial.

Menciones del ref legacy en **docs de auditoría histórica** pueden permanecer como evidencia; no son binding runtime.

---

## Fuera de alcance de este agente / de este epic

- Pegar Client Secret de Google/Apple en Dashboard (operador).
- Escribir en Lovable Cloud con token solo `projects:read` (fallo esperado).
- Inventar publishable / service_role en git.
- Nuevos módulos de negocio.

---

## Criterio de cierre INFRA-004

PASS cuando:

1. Binding runtime = solo `djangucecsphnejplvic`.  
2. Google OAuth E2E sin `/~oauth/initiate`.  
3. Smoke §Fase 4 PASS en al menos localhost + Preview (prod si ya publicado).  
4. `#66` + `#68` en `main`.  
5. Tag `v0.2.0-auth-complete` publicado.

Entonces — y solo entonces — reabrir desarrollo funcional.
