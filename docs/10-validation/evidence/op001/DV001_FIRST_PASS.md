# DV-001 · First PASS record

**Estado:** PASS (Runtime Verification · Playwright · 2026-07-25)  
**Alcance de este PASS:** identidad de runtime + navegación/RBAC verificada.  
**No cubre:** Day-0 operacional completo (sigue BLOCKED en Bootstrap Evidence).

| Campo | Valor |
|-------|-------|
| Branch certificada | `main` |
| Commit SHA | `dc49aaf49b0b148f074d9c6e180a1c7e82b815a1` (`dc49aaf` — tip `origin/main` al registrar) |
| Deployment ID | _(registrar `x-deployment-id` del deploy Playwright si disponible)_ |
| Fecha | 2026-07-25 |
| DV-001 | **PASS** |
| Post-deploy smoke (navegación / RBAC) | **PASS** (3/3 perfiles) |
| Post-deploy smoke OP-001 (dishes/menus/staff) | Pendiente Day-0 / Bootstrap Evidence |
| Environment URL | https://eatcleanapp.lovable.app |
| Operator | Runtime validation (Playwright) |
| Evidence doc | [RUNTIME_VERIFICATION_EVIDENCE.md](../../RUNTIME_VERIFICATION_EVIDENCE.md) |

## Marker probe notes (navegación)

```text
company_admin → /admin, sin SaasOpsEntry: PASS
saas_admin → /saas, Governance OK: PASS
mixed → /admin + SaasOpsEntry → /saas: PASS
BrandLeafMark ausente dentro de /admin shell: UX decision (not a bug)
```

## Linkage rule

Every EV-* artifact produced after this timestamp for the navigation wave must reference:

```text
SHA=dc49aaf49b0b148f074d9c6e180a1c7e82b815a1 · DV-001=PASS
```

Day-0 / bootstrap operational EV-* may cite a newer SHA if `main` advances; update this file when that deploy is certified.
