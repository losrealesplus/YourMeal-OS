# Workspace Entry Policy

**Estado:** Propuesta de producto (Functional Review Mode) — **no implementada**  
**Relacionado:** FCR-004 · FCR-005 · FCR-006 · [`homePathForRoles`](../../src/lib/home-path.ts)

---

## Por qué existe este concepto

En FCR aparecieron dos decisiones mezcladas:

| Decisión | Pregunta | Mecanismo |
|----------|----------|-----------|
| **Autorización (RBAC)** | ¿Qué puede hacer? | Roles · capabilities · guards |
| **Landing (Workspace Entry)** | ¿Dónde empieza a trabajar? | Política de entrada al workspace |

No son lo mismo.

Un rol puede *poder* abrir `/admin` y aun así *deber* aterrizar en su workspace operativo (menos clics, experiencia operacional).

---

## Política objetivo (producto)

| Rol | Landing | Superficie |
|-----|---------|------------|
| Customer | `/app` | Customer |
| Kitchen | `/admin/kitchen-execution` | Tenant · Workspace Cocina |
| Delivery | `/admin/delivery` | Tenant · Workspace Reparto |
| Support | `/admin/support` | Tenant · Workspace Atención |
| Accounting | `/admin/accounting` | Tenant · Workspace Contabilidad |
| Company Admin | `/admin` | **Tenant Surface** |
| SaaS Admin | `/saas` | **Platform Surface** |

Regla Kitchen (producto): entrar **directo al Workspace**, no al dashboard Ops.

---

## Código actual (observado)

Fuente única hoy: `homePathForRoles` (+ selector Bootstrap / DEV panel).

| Rol | Landing actual | Gap |
|-----|----------------|-----|
| Customer | `/app` | — |
| Kitchen | `/admin/kitchen` | FCR-004 → debería ser `kitchen-execution` |
| Delivery | `/admin/delivery` | — |
| Support | `/admin` | FCR-005 |
| Accounting | `/admin` | FCR-005 |
| Company Admin | `/admin` | — |
| SaaS Admin (+ `company_admin` en Bootstrap) | `/admin` | FCR-006 → política objetivo: `/saas` |

---

## Implementación futura (bloque Landings)

1. Extraer `workspaceEntryForRoles(roles)` (o renombrar/clarificar `homePathForRoles`).
2. Una sola fuente de verdad consumida por: login, Bootstrap selector, DEV panel, redirects post-auth.
3. No duplicar destinos en pantallas.
4. RBAC sigue en `src/permissions` — **sin** codificar landings ahí.

---

## Relación con superficies

```text
Tenant Surface     →  /admin/*
Platform Surface   →  /saas/*
Customer Surface   →  /app/*
```

La Entry Policy elige el **punto de entrada** dentro de la superficie autorizada.  
No sustituye RBAC-001 (qué superficie puede abrir cada rol).
