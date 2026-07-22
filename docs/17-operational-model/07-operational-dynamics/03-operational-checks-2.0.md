# 03 — Operational Checks 2.0

**Operational Dynamics v0.2**  
**Prerrequisito:** [OPERATIONAL_CHECKS](../../15-product/OPERATIONAL_CHECKS.md) (identidad de producto) · INV-043 · INV-054  
**Complementa** el Blueprint; no lo sustituye.

---

## De sí/no a cuatro resultados

Las pruebas VS demostraron que un Check binario no basta. Muchos escenarios terminan en **decisión humana**.

```text
Check
  ↓
Result
  ↓
Next Transition
```

Eso conecta Checks con [Lifecycles 2.0](./01-operational-lifecycles-2.0.md).

---

## Los cuatro resultados

| Resultado | Significado | Transición típica siguiente |
|-----------|-------------|------------------------------|
| **PASS** | Todo correcto | Happy Path / Resume / Release |
| **WARNING** | Puede continuar · conviene revisar | Happy Path **o** MANUAL si política Tenant |
| **BLOCKED** | No puede continuar | Queda en estado actual · o Protection (Hold) |
| **MANUAL DECISION** | El sistema **no** decide · el humano sí | Según decisión: Amend · Hold · Cancel · Resume · comprar · retrasar… |

### MANUAL DECISION (fundamental)

Alineado con INV-043 y principios de Operational Checks («el usuario decide»).

Ejemplos VS:

| Situación | Check | Resultado |
|-----------|-------|-----------|
| Pollo ETA 17:30 · producción 16:00 | ¿Puede iniciarse Batch? | MANUAL (retrasar vs comprar vs reducir) |
| Horno averiado · auxiliar parcial | ¿Puede reanudarse? | MANUAL |
| Amend 18 min antes | ¿Puede modificarse? | MANUAL / BLOCKED según ventana |

Nunca: compra automática o Confirm automático como sustituto de MANUAL DECISION.

---

## Anatomía Check 2.0

Además de la anatomía del Blueprint:

| Campo | Contenido |
|-------|-----------|
| **Transición ancla** | Dónde vive el Check (clase Happy / Operational / Protection / Exceptional) |
| **Pregunta** | ¿Puede …? |
| **Resultados posibles** | Subconjunto de PASS · WARNING · BLOCKED · MANUAL |
| **Next Transition por resultado** | Tabla explícita |
| **Impactos posibles** | Ver Capability Impact en Lifecycles 2.0 |
| **Adverbio temporal** | Before / During / … |

### Ejemplo — Hand Packaging to Route

| Resultado | Next Transition |
|-----------|-----------------|
| PASS | Hand to route |
| WARNING | Hand to route + alerta al Supervisor |
| BLOCKED | — (permanece Complete / Held) |
| MANUAL DECISION | Hold · o Hand tras confirmación humana |

### Ejemplo — Start Production (Stock insuficiente)

| Resultado | Next Transition |
|-----------|-----------------|
| PASS | Start Production |
| BLOCKED | — (sigue Ready to cook) |
| MANUAL DECISION | Pause planificado · o esperar Receive Stock · o Amend demanda |

---

## Relación con Recovery Pattern

```text
Detect        → Check (identidad / seguridad / capacidad)
Hold          → Protection Transition
Investigate   → (humano · datos)
Correct       → Operational Transition
Validate      → Check → PASS / BLOCKED / MANUAL
Release       → Protection Transition
Continue      → Happy Path
```

Cada flecha puede llevar un resultado de Check 2.0.

---

## Qué no cambia en el Blueprint

- Check protege operación · elimina pregunta · termina en acción · se explica · usuario decide · vive en transición.  
- Checks 2.0 **refina el resultado** y el enlace a la siguiente transición.

Documento canónico de identidad: [OPERATIONAL_CHECKS.md](../../15-product/OPERATIONAL_CHECKS.md).  
Dynamics 03 es la capa de **comportamiento** alineada al Operational Model.

---

## Relacionado

- [Lifecycles 2.0](./01-operational-lifecycles-2.0.md)  
- [README Dynamics](./README.md)  
- Principio 7 Invariants gobiernan (OPERATIONAL_CHECKS)
