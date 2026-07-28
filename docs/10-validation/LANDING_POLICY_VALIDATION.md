# Landing Policy Validation (LP-001)

**Estado:** **READY FOR RE-CERTIFICATION** (EP-OPS-002 · Correction)  
**Implementación:** [`src/lib/home-path.ts`](../../src/lib/home-path.ts)  
**Tests:** [`src/lib/home-path.spec.ts`](../../src/lib/home-path.spec.ts)

---

## Comportamiento final

`homePathForRoles(roles)` es determinista: mismo conjunto de roles → mismo destino (independiente del orden del array).

### Prioridad (mayor → menor)

1. Puro Platform (`saas_admin` sin staff Tenant) → `/saas`
2. Company Admin / Operations Manager → `/admin`
3. Staff único de departamento → workspace canónico
4. Familia exclusiva multi-rol (solo kitchen · solo delivery · solo support · solo accounting) → workspace de esa familia
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
| `saas_admin` + staff Tenant | Tenant-first (`/admin` o workspace vía reglas 2–4) |
| `kitchen` + `delivery` (u otras familias mezcladas) | `/admin` |
| `support` + `accounting` | `/admin` |

### Consumidores

`resolveHomePath` · Identity `homePath` · Bootstrap selector · DEV panel · `"/"` · `/auth` callback.  
`/auth/admin` usa `decideOperationsCenterEntry` (alineado; respeta `returnTo` seguro).

---

## Re-Certification Gate

```text
STATUS: READY FOR RE-CERTIFICATION

Correction evidence
  ☑ Prioridad y desempates documentados
  ☑ Destino único por conjunto de roles
  ☑ Tests de reproducibilidad

Gate: — (no PASS · pendiente pasada RI-001)
```
