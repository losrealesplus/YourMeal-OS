# NAVIGATION_REGRESSION_REPORT · BUGFIX-002

**Fecha:** 2026-07-26  
**Epic:** BUGFIX-002  
**Resultado:** **PASS**

---

## Matriz de regresión

| Actor | Escenario | Expectativa | Resultado |
|-------|-----------|-------------|-----------|
| Cliente | Login + RPC PO falla | Home `/app` · sesión usable | ✓ PASS |
| Empleado (`kitchen`) | Login + RPC PO falla | Home `/admin/kitchen` | ✓ PASS |
| Tenant Admin (`company_admin`) | Login + RPC PO falla | Home `/admin` | ✓ PASS |
| Platform Owner | Ensure OK → roles | Home `/admin` | ✓ PASS |
| Platform Owner | Ensure falla en `/auth/admin` | Error clasificado · **sin** acceso · Retry | ✓ PASS |
| Cualquiera | Ensure falla en home | **No** inventa `saas_admin` / staff | ✓ PASS |

---

## Evidencia de pruebas

Comando:

```bash
npx vitest run \
  src/lib/ensure-platform-owner-session.spec.ts \
  src/lib/resolve-home-path.spec.ts \
  src/lib/admin-auth-bootstrap.spec.ts
```

Cobertura añadida:

| Archivo | Qué valida |
|---------|------------|
| `ensure-platform-owner-session.spec.ts` | `required:true` throw · `required:false` / `try*` null · parse OK |
| `resolve-home-path.spec.ts` | Cliente / empleado / tenant admin / PO · sin privilegios inventados |
| `admin-auth-bootstrap.spec.ts` (existente) | Ops entry sigue propagando ensure failures |

Snapshot JSON: `docs/10-validation/evidence/bugfix-002/regression-run.json`

---

## Seguridad

| Check | Estado |
|-------|--------|
| Error ensure ≠ acceso Ops/SaaS | ✓ |
| Roles solo desde DB tras ensure (éxito) o roles previos | ✓ |
| Soft path no salta `assertStaffRoute` / `assertSaasRoute` | ✓ |
| Strict path no llama `loadRoles` si ensure lanza | ✓ |

---

## Conclusión

La navegación global **ya no depende** de una RPC exclusiva de Platform Owner.  
Las rutas de entrada Ops mantienen validación estricta.  
Seguridad idéntica — sin bypass.
