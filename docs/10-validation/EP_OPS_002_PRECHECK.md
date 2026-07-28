# EP-OPS-002 · Correction Status

**Fase:** Correction  
**Estado del bloque:** **READY FOR RE-CERTIFICATION**  
**Fecha:** 2026-07-28  

```text
Discovery        ✓ COMPLETADO
Evaluation       ✓ COMPLETADO
Correction       ✓ COMPLETADO  ← este documento
Re-Certification   Pendiente (pasada RI-001)
```

---

## Incidencias corregidas (sin re-evaluación)

| ID | Corrección |
|----|------------|
| **RBAC-001** | Separación Tenant `/admin` vs Platform `/saas`; deny Platform → Tenant home para staff |
| **WEP-001** | Landings directos por workspace (Support/Accounting/Kitchen/Delivery/…) |
| **LP-001** | `homePathForRoles` prioridad + desempates deterministas |

---

## Código tocado (navegación únicamente)

- `src/lib/home-path.ts` (+ specs)
- `src/lib/operations-workspaces.ts` (+ tests; workspace id `support`)
- `src/permissions/route-guards.ts` (+ specs)
- `src/lib/open-operations-center.spec.ts` (cobertura entry)

**No modificado:** Identity · Auth · OAuth · Phone · Sessions · RLS · Bootstrap · Platform Owner · capabilities / roles nuevos.

---

## Evidencia de corrección

| Artefacto | Estado |
|-----------|--------|
| [RBAC_SURFACE_CERTIFICATION](./RBAC_SURFACE_CERTIFICATION.md) | READY FOR RE-CERTIFICATION |
| [WORKSPACE_ENTRY_POLICY](./WORKSPACE_ENTRY_POLICY.md) | READY FOR RE-CERTIFICATION |
| [LANDING_POLICY_VALIDATION](./LANDING_POLICY_VALIDATION.md) | READY FOR RE-CERTIFICATION |
| [SURFACE_NAVIGATION_REPORT](./SURFACE_NAVIGATION_REPORT.md) | READY FOR RE-CERTIFICATION |
| [SURFACE_MATRIX](./SURFACE_MATRIX.md) | READY FOR RE-CERTIFICATION |

---

## Pregunta de cierre (Correction)

> ¿Las incidencias previamente detectadas han sido corregidas de forma que el bloque está preparado para volver a certificarse?

**Sí → READY FOR RE-CERTIFICATION**

No PASS. No CERTIFIED. No actualización de RI-001 Progress (certificación = siguiente pasada).
