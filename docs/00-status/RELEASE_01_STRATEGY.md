# RELEASE-01 · Product Strategy

**Documento:** `RELEASE_01_STRATEGY.md`  
**Fecha:** 2026-08-03  
**Estado:** ▶ **DRAFT · Strategy** (docs only · sin Spec · sin Runner)  
**Nivel:** Product Release · certificación SaaS de YourMeal OS  
**DoR:** [RELEASE_01_DOR](./RELEASE_01_DOR.md)  
**DoRl:** [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md)  
**Precondición:** tag `release-01-beta` → `facb917`  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md)

> Hasta `release-01-beta` se certificó el **sistema de validación**.  
> RELEASE-01 certifica el **producto** que ese sistema valida.

---

## Objetivo

Certificar que **YourMeal OS puede operar como plataforma SaaS**.

No certifica de nuevo:

- el framework FOPEBA  
- el pipeline Smoke · Cross-flow · E2E · Deploy · Rollback  
- la Beta Acceptance  

Eso ya está cerrado. RELEASE-01 responde:

> ¿El software hace lo que un SaaS de comida operable debe hacer?

---

## Cambio de nivel

```text
PS-002C → Track A → Track B → RELEASE-01-BETA
════════════════════════════════════════
Framework certificado · tag release-01-beta
════════════════════════════════════════
                ↓
           RELEASE-01
                ↓
        Producto certificado
                ↓
              v1.0
```

El pipeline de certificación se **reutiliza**.  
YourMeal OS es el **primer producto** que lo atraviesa como SaaS.

---

## Bloques (orden fijo)

```text
P1  Platform Foundation
P2  Core Business Modules
P3  Operations
P4  Administration
P5  Product Acceptance
        ↓
   RELEASE-01 PASS
```

Cada bloque, cuando se abra, seguirá FOPEBA de producto:

```text
Spec → Freeze → Runner → Gate → 001… → PASS
```

Esta Strategy **no** escribe implementación ni contratos ejecutables.

---

## P1 · Platform Foundation

Incluye únicamente:

- Authentication  
- Tenant  
- RBAC  
- Localization  
- Profiles  
- Settings  

Pregunta del bloque: ¿la plataforma admite identidad, aislamiento y configuración de tenant?

---

## P2 · Core Business Modules

Incluye únicamente:

- Dish Library  
- Ingredients  
- Recipes  
- Orders  
- Production  
- Customers  

Pregunta del bloque: ¿el núcleo de negocio del SaaS es operable de extremo a extremo?

---

## P3 · Operations

Incluye únicamente:

- Deliveries  
- Routes  
- Production Calendar  
- Inventory  
- Stock  

Pregunta del bloque: ¿las operaciones diarias (entrega, rutas, inventario) sostienen el producto?

---

## P4 · Administration

Incluye únicamente:

- Billing  
- Reports  
- Notifications  
- Audit  
- Configuration  

Pregunta del bloque: ¿administración, cobro y gobernanza son suficientes para operar el SaaS?

---

## P5 · Product Acceptance

Incluye únicamente:

- Acceptance checklist  
- Cross-module verification  
- Platform readiness  

Pregunta del bloque: ¿el producto como conjunto está listo para declararse RELEASE-01 PASS?

P5 **compone** outcomes P1–P4. No reabre módulos ni re-certifica Track B.

---

## Relación con Flows

| Artefacto | Rol en RELEASE-01 |
|-----------|-------------------|
| FLOW-01…04 | Insumo ya certificado · no reabrir |
| FLOW-05+ | Solo si es **criterio** de un bloque P1–P5 · no por inercia |
| Track B runners | Infraestructura reutilizable · no objetivo de RELEASE-01 |

---

## Fuera de esta Strategy

- Spec · Runner · Gate · scripts · tests  
- Reabrir Smoke / Deploy / Rollback / Beta  
- Semver `v*` · marketing · despliegue productivo masivo  

---

## Next

```text
RELEASE-01 DoR OPEN
    ↓
READY TO OPEN RELEASE-01 Spec
(contract only · bloques P1–P5)
```

---

## End of RELEASE-01 Strategy
