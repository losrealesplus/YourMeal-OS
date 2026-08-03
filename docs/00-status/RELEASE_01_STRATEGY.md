# RELEASE-01 · Product Strategy

**Documento:** `RELEASE_01_STRATEGY.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ **ACTIVE** · Spec FROZEN · Runner through P2 · Gate READY · 002 ▶  
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

Incluye únicamente (plataforma base · sin módulos de negocio):

- Authentication  
- Tenant  
- RBAC  
- Profiles  
- Localization  
- Settings  

Pregunta del bloque: ¿la plataforma admite identidad, aislamiento y configuración de tenant?

---

## P2 · Core Business Modules

Incluye únicamente (núcleo funcional · todavía sin operaciones):

- Dish Library  
- Ingredients  
- Recipes  
- Customers  
- Orders  

Pregunta del bloque: ¿el núcleo de negocio del SaaS es operable de extremo a extremo?

---

## P3 · Operations

Incluye únicamente (operación diaria):

- Production  
- Production Calendar  
- Routes  
- Deliveries  
- Inventory  

Pregunta del bloque: ¿las operaciones diarias (producción, rutas, entrega, inventario) sostienen el producto?

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

Cierre de RELEASE-01. Incluye únicamente:

- Acceptance checklist  
- Cross-module verification (coherencia entre módulos)  
- Navegación principal  
- Consistencia SaaS  
- Platform readiness / criterios funcionales del producto  

Pregunta del bloque: ¿el producto como conjunto está listo para declararse RELEASE-01 PASS?

P5 **compone** outcomes P1–P4.  
**No** reabre módulos.  
**No** re-ejecuta Smoke · Cross-flow · E2E · Deploy · Rollback (pipeline ya certificado).

---

## Relación con Flows

| Artefacto | Rol en RELEASE-01 |
|-----------|-------------------|
| FLOW-01…04 | Insumo ya certificado · no reabrir |
| FLOW-05+ | Solo si es **criterio** de un bloque P1–P5 · no por inercia |
| Track B runners | Infraestructura reutilizable · no objetivo de RELEASE-01 |

---

## Fuera de esta Strategy (sigue vigente para capacidades)

- Drivers P1–P5 · UI de producto · migraciones  
- FLOW-05 · Capacitor · Play Store · App Store  
- Reabrir Smoke / Cross-flow / E2E / Deploy / Rollback / Beta  
- CI/CD adicional · producción real · semver `v*` · marketing  

---

## Next

```text
RELEASE-01-002 · P2 OPEN
    ↓
READY TO OPEN RELEASE-01-003 · P3 only (tras Land Check)
```

---

## End of RELEASE-01 Strategy
