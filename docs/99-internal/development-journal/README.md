# Diario de Desarrollo del Proyecto

**Project Development Journal**

## Principio

> **Nada se añade al proyecto sin una razón de existir.**

Este diario es:

- Interno (historial intelectual).
- Solo lectura para entender el pasado.
- **No** forma parte del producto.
- **No** sustituye ADRs ni docs técnicas de módulo.
- Explica el **porqué** detrás de cada decisión importante.

El código explica el **cómo**. Este diario explica el **porqué**.

## Idioma

Español (ADR 0010).

## Organización

```text
docs/99-internal/development-journal/
  README.md
  2026-07-20-foundation-lock.md
  2026-07-20-constitucion-y-arranque-module-01.md
  2026-07-23-transicion-ri001-g02.md
  2026-07-24-cierre-jornada-certificacion.md
  YYYY-MM-DD-<hito-o-tema>.md
```

### Última ficha

- [2026-07-24 · Cierre jornada certificación](./2026-07-24-cierre-jornada-certificacion.md) — RBAC PASS · Dual Ops · CHECK-IT 05 NOT READY · Certification Sprint

Un archivo por **jornada** o por **hito**, no un monolito.

## Plantilla obligatoria por ficha

Cada incorporación relevante usa:

```markdown
# [Título]

Fecha:
Versión:
Módulo:
Estado:

---

## ¿Qué es?
## ¿Cómo es?
## ¿Por qué existe?
## ¿Para qué sirve?
## Objetivos
## Reglas
## Dependencias
## Futuro
## Decisiones tomadas
```

## Qué se documenta

Módulos funcionales **y** piezas de arquitectura: Dish Library, Ingredient Library, Recipe Builder, Notification Service, Audit Service, RBAC, Feature Flags, Localization, Service Context, Eventos, Inventario, Producción, Facturación, IA, etc.

## Cuándo se escribe

> **Cada funcionalidad se documenta cuando queda terminada y antes de considerarla "Done".**

También en el **cierre de jornada** (paso «Actualización del Diario»).

## Relacionado

- [ADR 0011](../adr/0011-diario-desarrollo-intencionalidad.md)
- [Cierre de jornada](../05-architecture/CIERRE_DE_JORNADA.md)
- [Definition of Done](../00-status/DEFINITION_OF_DONE.md)
