# Runtime Verification Evidence

**Fecha:** 2026-07-25  
**Método:** Playwright sobre el runtime actual (Lovable / publish branch)  
**Alcance:** Navegación · landing por rol · entrada SaaS · RBAC de superficie  
**Fuera de alcance:** Day-0 operacional · menús · pedidos · cocina · entrega  

---

## Usuarios de prueba

| Usuario | Roles |
|---------|-------|
| `test-company-admin@example.com` | `company_admin` |
| `test-saas-admin@example.com` | `saas_admin` |
| `test-mixed@example.com` | `company_admin` + `saas_admin` |

---

## Resultados

### Caso 1 — `company_admin`

| Paso | Observado | Resultado |
|------|-----------|-----------|
| Landing | `/admin` | ✅ PASS |
| Entrada “Centro de Operaciones YourMeal OS” (`SaasOpsEntry`) | No aparece | ✅ PASS (esperado) |
| Permanece en tenant Ops | `/admin` | ✅ PASS |

**Capturas (referencias):**

- `company_admin_only_before.png`
- `company_admin_only_after.png`

---

### Caso 2 — `saas_admin`

| Paso | Observado | Resultado |
|------|-----------|-----------|
| Landing | `/saas` | ✅ PASS |
| Governance Overview | Carga correctamente | ✅ PASS |

**Capturas (referencias):**

- `saas_admin_only_before.png`

---

### Caso 3 — `company_admin` + `saas_admin` (mixed)

| Paso | Observado | Resultado |
|------|-----------|-----------|
| Landing | `/admin` | ✅ PASS |
| Visible “Centro de Operaciones YourMeal OS” | Sí | ✅ PASS |
| Click → destino | `/saas` | ✅ PASS |

**Capturas (referencias):**

- `mixed_before.png`
- `mixed_after.png`

---

## Resumen

| Perfil | Landing | Navegación observada | Resultado |
|--------|---------|----------------------|-----------|
| `company_admin` | `/admin` | Sin entrada SaaS; permanece en `/admin` | ✅ PASS |
| `saas_admin` | `/saas` | Governance Overview OK | ✅ PASS |
| mixed | `/admin` → `/saas` | Entrada SaaS visible y funcional | ✅ PASS |

---

## UX decision — BrandLeafMark (no bug)

`BrandLeafMark` (target admin / “Centro de Operaciones”) **no se renderiza** dentro del shell `/admin`.

Solo está presente en flujos de autenticación (y superficies pre-ops / customer home según montaje actual).

**Decisión de UX (documentada, sin cambio de código):**

> Una vez que el usuario se encuentra dentro del Centro de Operaciones (`/admin`), no se vuelve a mostrar un acceso que navegue al mismo destino.

No implementar cambios. No tratarlo como incidencia.

---

## FOPEBA impact

| Dominio | Estado tras esta evidencia |
|---------|----------------------------|
| Runtime Deployment | ✅ PASS |
| Runtime Navigation / RBAC | ✅ PASS |
| Bootstrap Evidence | ⛔ BLOCKED (Day-0 pendiente) |
| CHECK-IT 05 | ⛔ BLOCKED |

---

## Next

Day-0 operacional → ORR PASS → CHECK-IT 05.  
No PRs funcionales requeridos por esta evidencia.
