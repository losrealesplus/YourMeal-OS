# RELEASE-01 · Definition of Ready

**Documento:** `RELEASE_01_DOR.md`  
**Fecha:** 2026-08-03  
**Estado:** ▶ **DoR OPEN** (docs only · aún no CERTIFIED en `main`)  
**Nivel:** Product Release · primera certificación del **producto** (no del framework)  
**Pregunta (única):** ¿Qué debe demostrar YourMeal OS para certificarse como plataforma SaaS operable?  
**Estrategia:** [RELEASE_01_STRATEGY](./RELEASE_01_STRATEGY.md)  
**DoRl:** [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md)  
**Land Check:** [FOPEBA_LAND_CHECK](./FOPEBA_LAND_CHECK.md)  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md)  
**Precondición:** tag `release-01-beta` → `facb917` (pipeline de validación ya certificado)

> RELEASE-01-BETA certificó **cómo liberar**.  
> RELEASE-01 certifica **qué hace el producto**.

---

## Definition of Ready

RELEASE-01 puede abrirse cuando:

```text
☑ RELEASE-01-BETA CERTIFIED          → tag release-01-beta
☑ Pipeline de validación cerrado     → Smoke…Rollback · Beta Acceptance
☑ Pregunta de producto formulada     → este DoR
☑ Estrategia de bloques documentada  → RELEASE_01_STRATEGY.md
☐ Spec FROZEN                        → aún no (siguiente incremento)
☐ Runner / Gate                      → aún no
☐ Capacidades P1…P5                  → aún no
```

Este documento **no** abre Spec, Runner, Gate ni implementación.

---

## Objetivo

Definir qué debe demostrar **RELEASE-01** para declarar que YourMeal OS  
está listo como **plataforma SaaS operable**: autenticación, tenant, módulos  
de negocio, operaciones y administración verificables como producto.

RELEASE-01 **no** vuelve a certificar el framework FOPEBA ni el Track B  
(Smoke · Cross-flow · E2E · Deploy · Rollback · Beta). Eso ya está cerrado  
bajo `release-01-beta`.

---

## Alcance

Documentar el marco de readiness para certificar el **producto**:

| Incluye (marco) | Significa |
|-----------------|-----------|
| Objetivo de producto | YourMeal OS como SaaS operable |
| Bloques P1–P5 | Orden estratégico en [RELEASE_01_STRATEGY](./RELEASE_01_STRATEGY.md) |
| Dependencia de Beta | Reutilizar pipeline ya certificado; no reconstruirlo |
| Criterios para Spec | Condiciones mínimas antes del contrato ejecutable |

Cada bloque P1…P5 seguirá, **más adelante** y en PRs separados:

```text
DoR (bloque) → Spec → Freeze → Runner → Gate → 001… → PASS
```

---

## Fuera de alcance

En este DoR (y en este PR) **no** se crea ni se abre:

- Spec · Runner · Gate · Drivers · scripts · tests · `package.json`
- FLOW-05 (ni por inercia)
- Re-certificación de Smoke · Cross-flow · E2E · Deploy · Rollback
- Acceptance ejecutable de producto
- Semver `v1.0` · marketing readiness · producción multi-tenant masiva
- Nueva funcionalidad de dominio fuera del marco documental

---

## Dependencias

| Dependencia | Estado | Rol |
|-------------|--------|-----|
| Foundation / Platform locks | ✅ | Identidad · core operativo |
| `ps002c-pass` | ✅ | Auth / estabilización |
| `flow01-pass` … `flow04-pass` | ✅ | Flujos de dominio ya certificados (insumo, no reabrir) |
| `release-smoke-pass` … `release-rollback-pass` | ✅ | Capacidades de release (pipeline) |
| `release-01-beta` | ✅ → `facb917` | Framework de validación cerrado |
| DoRl | ▶ DRAFT | Estándar de producto; RELEASE-01 lo instancia |

El pipeline Track B se **reutiliza** como infraestructura.  
RELEASE-01 lo **consume**; no lo reimplementa.

---

## Criterios para abrir Spec

Abrir **RELEASE-01 Spec** solo cuando:

```text
1. Este DoR esté mergeado en main (DoR CERTIFIED)
2. RELEASE_01_STRATEGY.md permanezca alineada (bloques P1–P5)
3. La pregunta única no cambie de nivel
   (producto SaaS · no framework · no Deploy/Rollback)
4. El Spec proponga contrato por bloques P1–P5
   sin inventar runners de Smoke/Deploy/Rollback
5. FLOW-05, si aparece, sea criterio de RELEASE-01
   — no un track paralelo por inercia
```

Hasta entonces:

```text
READY TO OPEN
RELEASE-01 Spec
Contract only.
No Runner · No Gate · No implementation · No FLOW-05.
```

---

## Next

```text
DoR OPEN (este documento)
    ↓
Merge → DoR CERTIFIED en main
    ↓
READY TO OPEN
RELEASE-01 Spec
```

---

## End of RELEASE-01 DoR
