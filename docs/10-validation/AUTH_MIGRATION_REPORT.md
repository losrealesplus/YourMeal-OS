# INFRA-003 · AUTH_MIGRATION_REPORT

**Epic:** Auth Migration (Lovable → Native Supabase Auth)  
**Fecha:** 2026-07-25  
**Branch:** `cursor/infra-003-auth-migration-f54a`  
**Proyecto Supabase objetivo:** `djangucecsphnejplvic`

---

## 1. Qué se hizo

| Fase | Entregable | Estado |
|------|------------|--------|
| 1 Auditoría | [AUTH_AUDIT.md](./AUTH_AUDIT.md) | Done |
| 2 Validación Auth project | [SUPABASE_AUTH_VALIDATION.md](./SUPABASE_AUTH_VALIDATION.md) | Done (oficial UNVERIFIED sin keys) |
| 3 Capa `src/auth/` | `client`, `oauth`, `session`, `credentials`, `callback`, `guards`, `urls`, `index` | Done |
| 4 OAuth nativo | `signInWithOAuth` → `supabase.auth.signInWithOAuth` (Google/Apple; Microsoft→azure mapeado) | Done |
| 5 Callback | Ruta `/auth/callback` + `exchangeCodeForSession` | Done |
| 6 Sesiones | UI/hooks usan `@/auth` (`getSession`, `onAuthStateChange`, `signOut`, …) | Done |
| 7 Limpieza | Eliminado `@lovable.dev/cloud-auth-js` + `src/integrations/lovable/` | Done |
| 8–9 Validación / regresión | Checklist operador | Pendiente ejecución humana |
| 10 Docs | Este informe + ADR 0004 + checklist | Done |

---

## 2. Dependencias

### Eliminadas

| Paquete / archivo | Motivo |
|-------------------|--------|
| `@lovable.dev/cloud-auth-js` | Broker `/~oauth/initiate` (404 fuera de Lovable) |
| `src/integrations/lovable/index.ts` | Wrapper OAuth obsoleto |

### Conservadas

| Paquete / archivo | Motivo |
|-------------------|--------|
| `@supabase/supabase-js` | Única fuente de Auth |
| `@lovable.dev/vite-tanstack-config` | Build/preview Lovable (no es Auth) |
| `src/lib/lovable-error-reporting.ts` | Telemetría runtime, no login |
| `src/integrations/supabase/*` | Client, middleware JWT, types |

---

## 3. Arquitectura resultante

```text
UI (auth.tsx, shells, locale…)
        │
        ▼
   src/auth/*   ← única API de aplicación
        │
        ▼
integrations/supabase/client.ts
        │
        ▼
   Supabase Auth (GoTrue)
```

- OAuth redirect: `{origin}/auth/callback`
- Password reset: `{origin}/reset-password` (sin cambio de ruta)
- Post-login: `resolveHomePath` (sin cambio)
- Guards: `_authenticated` → `requireAuthenticatedUser()`; capability guards re-exportados

**No** se llama a `/~oauth/initiate` en el código de aplicación.

---

## 4. Criterio de éxito (código vs runtime)

| Criterio | Código | Runtime |
|----------|--------|---------|
| Login Google vía Supabase Auth | ✅ API nativa | ☐ Operador (providers + Redirect URLs + keys oficiales) |
| Sin `/~oauth/initiate` | ✅ | ☐ Confirmar Network en Preview |
| Sin `@lovable.dev/cloud-auth-js` | ✅ removido de `package.json` | ✅ |
| Sesiones solo Supabase | ✅ | ☐ Smoke logout/reload |
| Localhost + producción | ✅ callback path portable | ☐ Allowlist Redirect URLs |
| Sin regresiones portales | Build + unit tests auth URLs | ☐ Checklist §6 |

---

## 5. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Providers OFF / secrets mal en `djangucecsphnejplvic` | Checklist en SUPABASE_AUTH_VALIDATION §6 |
| Redirect URL no allowlisted | Añadir `/auth/callback` en Dashboard |
| `.env` aún en legacy (INFRA-002) | Cutover keys antes de smoke prod |
| Phone UI con Phone provider OFF | Documentado; no bloquear OAuth |
| Sesiones existentes Lovable-broker | Tokens siguen siendo JWT Supabase; `setSession` ya usaba Supabase — usuarios con localStorage válido continúan; nuevos OAuth usan PKCE callback |
| Apple web config | Operador valida Services ID / return URLs |

---

## 6. Evidencias de funcionamiento (automatizadas)

| Check | Resultado |
|-------|-----------|
| `vite build` | PASS (incluye `/auth/callback` en route tree) |
| `vitest` `src/auth/urls.spec.ts` | PASS |
| Grep `cloud-auth-js` / `createLovableAuth` en `src/` | Sin matches (solo docs de auditoría histórica) |
| Grep `lovable.auth` en `src/` | Sin matches |

Login Google/Apple end-to-end **no** ejecutado en este agente (sin credenciales OAuth ni publishable del proyecto oficial).

---

## 7. Checklist de validación funcional

Ver [checklists/INFRA003_AUTH_MIGRATION_CHECKLIST.md](./checklists/INFRA003_AUTH_MIGRATION_CHECKLIST.md).

---

## 8. Commits (atómicos)

1. `docs(infra-003): add AUTH_AUDIT and SUPABASE_AUTH_VALIDATION`
2. `feat(auth): add native Supabase auth layer (INFRA-003 phase 3)`
3. `feat(auth): migrate OAuth to Supabase and remove Lovable broker`
4. `docs(infra-003): AUTH_MIGRATION_REPORT + checklist + ADR note` (este)

---

## 9. Cierre

INFRA-003 **código** está listo para merge condicionado a:

1. Operador completa Auth providers + Redirect URLs en proyecto oficial.  
2. INFRA-002 cutover de `.env` / publishable.  
3. Smoke checklist PASS (Google, logout, reload, guards).

Hasta entonces el merge del código es seguro (elimina 404 local del broker) pero OAuth social en el proyecto oficial requiere §6 de validación Auth.
