# Landing Policy Validation (LP-001)

**Estado:** **CERTIFIED** (EP-OPS-002 · 2026-07-28)  
**Implementación:** [`src/lib/home-path.ts`](../../src/lib/home-path.ts)  
**Tests:** [`src/lib/home-path.spec.ts`](../../src/lib/home-path.spec.ts)

---

## Pregunta

> ¿`homePathForRoles(roles)` es determinista para cualquier conjunto de roles?

**Respuesta: SÍ.** Mismo multiset de roles → mismo path. El orden de entrada no altera el resultado (prioridad por reglas, no por posición en el array).

---

## Prioridad (mayor → menor)

1. **Puro Platform** — `saas_admin` **sin** ningún rol de staff Tenant → `/saas`
2. **Company Admin / Operations Manager** → `/admin`
3. **Staff único de departamento** → workspace canónico (tabla abajo)
4. **Familias exclusivas multi-rol** — solo kitchen · solo delivery/logistics · solo support · solo accounting → workspace de esa familia
5. **Otro staff Tenant** (multi-departamento mezclado) → `/admin` (picker / Ops Center)
6. **Driver** (sin staff superior) → `/driver`
7. **Customer / default** → `/app`

### Staff Tenant reconocido

`company_admin` · `operations_manager` · `kitchen` · `purchasing` · `inventory` · `production` · `support` · `accounting` · `logistics` · `delivery`

---

## Mapa rol → landing (únicos)

| Rol(es) | Landing |
|---------|---------|
| `saas_admin` solo | `/saas` |
| `company_admin` | `/admin` |
| `operations_manager` | `/admin` |
| `kitchen` \| `production` | `/admin/kitchen` |
| `delivery` \| `logistics` | `/admin/delivery` |
| `support` | `/admin/support` |
| `accounting` | `/admin/accounting` |
| `inventory` \| `purchasing` | `/admin/inventory` |
| `driver` | `/driver` |
| `customer` / vacío | `/app` |

---

## Desempates

| Caso | Regla | Destino |
|------|-------|---------|
| `company_admin` + cualquier otro | Admin gana | `/admin` |
| `operations_manager` + dept | Ops gana | `/admin` |
| `saas_admin` + staff Tenant | Tenant-first | `/admin` (o workspace vía reglas 2–4) |
| `kitchen` + `delivery` | Multi-familia | `/admin` |
| `support` + `accounting` | Multi-familia | `/admin` |
| Solo `kitchen` + `production` | Familia cocina | `/admin/kitchen` |

---

## Consumidores (una sola política)

| Flujo | Usa LP |
|-------|--------|
| `resolveHomePath` | Sí |
| Identity providers (`homePath`) | Sí |
| Bootstrap selector / DEV panel | Sí |
| Ruta `"/"` con sesión | Sí → `resolveHomePath` |
| `/auth` / callback post-login | Sí → `resolveHomePath` |
| `/auth/admin` | `decideOperationsCenterEntry` (alineado WEP; respeta `returnTo` seguro) |

---

## Evidence Gate · LP-001

```text
STATUS: CERTIFIED

Evidence
  ☑ Prioridad documentada
  ☑ Desempates documentados
  ☑ Determinismo verificado en tests (incl. orden invertido)
  ☑ Platform Owner / SaaS · Company Admin · Employees · Customers cubiertos

Gate: PASS
```
