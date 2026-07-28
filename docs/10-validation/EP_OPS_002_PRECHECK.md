# EP-OPS-002 · Surface & Workspace Certification

**Estado final:** **CERTIFIED** (2026-07-28)  
**Ciclo P13 completo:**

```text
Discovery → Evaluation → Correction → Re-Certification → CERTIFIED
```

| ID | Estado |
|----|--------|
| RBAC-001 | ✅ CERTIFIED |
| WEP-001 | ✅ CERTIFIED |
| LP-001 | ✅ CERTIFIED |

---

## Alcance certificado (mínimo)

| Ítem | Resultado |
|------|:---------:|
| Landings Support · Accounting · Inventory | ✅ |
| Workspace `support` consolidado | ✅ |
| Company Admin → `/saas` denegado → `/admin` | ✅ |
| Sin cambios Auth | ✅ |
| Sin cambios Identity | ✅ |
| Sin cambios modelo RBAC | ✅ |
| Solo navegación / entry policy | ✅ |

---

## Evidencia

| Artefacto | Path |
|-----------|------|
| Surface Certification | [RBAC_SURFACE_CERTIFICATION](./RBAC_SURFACE_CERTIFICATION.md) |
| Workspace Entry Policy | [WORKSPACE_ENTRY_POLICY](./WORKSPACE_ENTRY_POLICY.md) |
| Landing Policy | [LANDING_POLICY_VALIDATION](./LANDING_POLICY_VALIDATION.md) |
| Navigation Report | [SURFACE_NAVIGATION_REPORT](./SURFACE_NAVIGATION_REPORT.md) |
| Surface Matrix | [SURFACE_MATRIX](./SURFACE_MATRIX.md) |

---

## Impacto RI-001

| Bloque | Estado |
|--------|--------|
| **B · Surfaces** | **PASS** (Tenant + Platform entry architecture) |
| **C · Entry** | **CERTIFIED** (cómo entra el usuario) |
| **C · Operational Journeys** | Pendiente (cómo trabaja — siguiente foco) |

### Siguiente foco (no parte de EP-OPS-002)

```text
Workspace → Operational Journey
```

Kitchen · Delivery · Support · Accounting — jornadas diarias, no solo acceso.

---

## Pregunta maestra (cerrada)

> ¿Cuando cualquier usuario inicia sesión, entra automáticamente en la superficie correcta, el workspace correcto y el contexto operacional correcto?

**Sí.** Arquitectura de entrada certificada · PR #88.
