# CAP-001 — Auth & User Context

**Estado:** Connected  
**Objetivo próximo:** mantener Connected; no regresionar.

---

## Objetivo

Sesión autenticada + contexto de usuario/tenant disponible para Customer App.

## Alcance

Auth existente · `useAuth` · tenant · perfil/locale si ya cableado.

## No hacer

Rediseñar pantalla auth · cambiar providers · inventar roles.

## Traceability

| Campo | Valor |
|-------|-------|
| OM | Organization · Account (contexto) |
| Infra | Supabase Auth · RLS · i18n |

## Prompt

```text
Revisar CAP-001 Auth & User Context.
Estado objetivo: Connected (mantener).
No modificar UX de auth.
No inventar roles.
Solo corregir gaps de contexto usuario/tenant si typecheck o Happy Path lo exigen.
Cerrar con formato oficial del Master Prompt.
```
