# Landing Policy Validation (LP-001)

**Estado:** ✅ **CERTIFIED** (EP-OPS-002 · 2026-07-28)  
**Implementación:** [`src/lib/home-path.ts`](../../src/lib/home-path.ts)  
**Tests:** [`src/lib/home-path.spec.ts`](../../src/lib/home-path.spec.ts)

---

## Pregunta

> ¿`homePathForRoles(roles)` es determinista para cualquier conjunto de roles?

**Respuesta: SÍ.**

---

## Prioridad (mayor → menor)

1. Puro Platform (`saas_admin` sin staff Tenant) → `/saas`
2. Company Admin / Operations Manager → `/admin`
3. Staff único de departamento → workspace canónico
4. Familia exclusiva multi-rol → workspace de esa familia
5. Otro staff Tenant mezclado → `/admin`
6. Driver → `/driver`
7. Customer / default → `/app`

### Mapa (roles únicos)

| Rol(es) | Landing |
|---------|---------|
| `saas_admin` solo | `/saas` |
| `company_admin` / `operations_manager` | `/admin` |
| `kitchen` / `production` | `/admin/kitchen` |
| `delivery` / `logistics` | `/admin/delivery` |
| `support` | `/admin/support` |
| `accounting` | `/admin/accounting` |
| `inventory` / `purchasing` | `/admin/inventory` |
| `driver` | `/driver` |
| `customer` / vacío | `/app` |

### Desempates

| Caso | Destino |
|------|---------|
| `company_admin` o `operations_manager` + otros | `/admin` |
| `saas_admin` + staff Tenant | Tenant-first |
| Familias de departamento mezcladas | `/admin` |

---

## Evidence Gate · LP-001

```text
STATUS: CERTIFIED

Evidence
  ☑ Prioridad documentada
  ☑ Desempates documentados
  ☑ Determinismo verificado en tests
  ☑ Platform / Company Admin / Employees / Customers cubiertos

Gate: PASS
```
