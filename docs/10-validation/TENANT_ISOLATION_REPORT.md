# INFRA-005 · TENANT_ISOLATION_REPORT

**Fecha:** 2026-07-26  
**Proyecto:** `djangucecsphnejplvic`  
**Tenant seed observado:** `eatclean-tenerife` (`7823e85a-986f-401f-9bbe-e4e431ff3be1`)

---

## 1. Principio

El aislamiento es **RLS + membership**, no filtros solo de UI.

```text
auth.uid()
  → tenant_members / user_roles (tenant_id)
  → políticas RLS en tablas tenant-scoped
```

No se modificaron políticas ni migraciones en INFRA-005.

---

## 2. Evidencia API (probe aislado)

Dos usuarios Auth confirmados (A, B), sin memberships. Sesión de A:

| Query (como A) | Esperado | Resultado |
|----------------|----------|-----------|
| `profiles` where id=A | 1 fila | PASS |
| `profiles` where id=B | 0 filas | PASS |
| `profiles` select * | solo propia (count=1) | PASS |
| `dishes` limit 5 | 0 (sin membership) | PASS |
| `tenants` select | [] (sin membership) | PASS |

Conclusión: un usuario autenticado **sin** `tenant_members` no enumera el tenant ni catálogo; no lee perfiles ajenos.

---

## 3. Superficies de aislamiento (código)

| Superficie | Mecanismo |
|------------|-----------|
| Data API | RLS por `tenant_id` / helpers membership |
| Server functions SaaS | `requireSupabaseAuth` + checks `saas_admin` |
| Invite staff | `inviteTenantStaff` acotado al tenant del caller |
| Customer B2B | `ensure_individual_customer(tenant_id, …)` explícito |
| Feature flags admin | `feature_flags.tenant_id` (ADR 0007) |

---

## 4. Escenarios de validación operador

```text
□ Usuario tenant T1 no ve dishes/orders/customers de T2
□ company_admin T1 no invita roles en T2
□ saas_admin puede operar cross-tenant solo vía /saas (capabilities saas.*)
□ Customer T1 no accede URLs admin aunque las conozca (guard redirect)
□ Tras revoke tenant_members, datos T1 dejan de ser visibles
```

Con un solo tenant seed (`eatclean-tenerife`), el aislamiento **cross-tenant** E2E completo requiere un segundo tenant (crear vía flujo SaaS — no SQL ad hoc). Estado actual:

| Check | Estado |
|-------|--------|
| Aislamiento user↔user (profiles) | PASS (probe) |
| Aislamiento sin membership ↔ tenant data | PASS (probe) |
| Aislamiento T1↔T2 con dos tenants | ⬜ PENDING (solo 1 tenant en proyecto) |

---

## 5. Relación con identidad

- Signup crea identidad global (`auth.users` + `profiles`) **sin** tenant hasta membership.  
- Eso es correcto: evita acoplar Auth user a un tenant antes de onboarding.  
- Platform Owner ensure (OP-002) asocia al `defaultTenantSlug` (`eatclean-tenerife`) vía RPC — no bypass RLS genérico.

---

## 6. Veredicto

| Dimensión | Resultado |
|-----------|-----------|
| Isolation baseline (no membership / other profile) | ✅ PASS |
| Multi-tenant adversarial E2E | ⬜ PENDING (falta 2º tenant + roles) |
| Cambios RLS en este epic | Ninguno (cumplido) |

**No se introduce bypass.** Cualquier prueba T1/T2 futura debe usar invites/SaaS admin, no `INSERT` directo en `user_roles` desde SQL client salvo seeds oficiales documentados.
