# Development Identity Adapter

**FOPEBA · Evidence Framework**  
**Estado:** Accepted · 2026-07-26  
**Implementación de referencia:** [BOOTSTRAP_MODE](../00-status/BOOTSTRAP_MODE.md) · EP-BOOTSTRAP-001  

---

## Regla

> Cuando la identidad de producción bloquee la validación de otras capacidades, podrá utilizarse un **proveedor de identidad alternativo exclusivamente para desarrollo**, siempre que:
>
> 1. no modifique la lógica de negocio;
> 2. no altere RBAC (solo el origen de la identidad / roles de sesión);
> 3. no cambie rutas ni componentes consumidores;
> 4. sea reversible mediante configuración;
> 5. esté **claramente identificado** como modo de desarrollo (banner / indicador permanente).

Esto diferencia una **herramienta de ingeniería** de un bypass improvisado.

---

## Patrón requerido

```text
App
 └─ IdentityProvider
     ├─ ProductionIdentityProvider   (default)
     └─ DevelopmentIdentityProvider  (flag explícita)
```

Consumidores: mismo contrato (`useAuth()` / misma forma de sesión).  
Prohibido: `if (bootstrap)` en pantallas, servicios o repositorios de dominio.

---

## Qué certifica / qué no

| Con adaptador de desarrollo | Sin evidencia de Auth real |
|-----------------------------|----------------------------|
| Completitud funcional de pantallas | Signup / login / reset / JWT |
| Navegación · guards con roles inyectados | Persistencia de sesión Auth |
| Hallazgos P0–P3 de UX/operación UI | Aislamiento tenant vía RLS con JWT |

Los hallazgos de FCR obtenidos bajo el adaptador **siguen siendo válidos** para UI/operación siempre que la arquitectura de consumidores no se alterara.  
Los hallazgos de **Auth** siguen el bloque Identity Frozen + P12 PRE-CHECK.

---

## Severidad de hallazgos (FCR)

| Nivel | Significado |
|-------|-------------|
| **P0** | Bloquea la operación |
| **P1** | La funcionalidad existe pero no puede completarse |
| **P2** | Problemas de UX |
| **P3** | Detalles visuales |

No mezclar niveles en el mismo ítem.

Checklist operacional: [BOOTSTRAP_FCR_CHECKLIST](../10-validation/BOOTSTRAP_FCR_CHECKLIST.md).  
Certificación por superficie: [OPERATIONAL_READINESS_CERTIFICATION](../10-validation/OPERATIONAL_READINESS_CERTIFICATION.md) (FCR → ORR).

---

## Relación

- [P12 · Evidence Freshness](./10-evidence-freshness-p12.md) — no reabrir Auth con hallazgos STALE  
- [Identity Freeze v1](../00-status/IDENTITY_FREEZE_v1.md) — producción congelada  
- [BOOTSTRAP_MODE](../00-status/BOOTSTRAP_MODE.md) — implementación YourMeal OS  
- [ORC · Surface Certified](../10-validation/OPERATIONAL_READINESS_CERTIFICATION.md) — FCR como evidencia hacia ORR  
