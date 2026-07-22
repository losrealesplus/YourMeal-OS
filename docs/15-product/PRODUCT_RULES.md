# Product Rules — YourMeal OS

Estado: Canónico · v0.1.0
Ámbito: Toda pantalla del producto (Cliente · Administración · Producción · Reparto · SaaS)

---

## Regla de intencionalidad de pantalla

Toda pantalla debe responder **estas tres preguntas** antes de diseñarse, implementarse o aprobarse.

Si una pantalla no puede responder las tres con claridad, **no debe existir**.

### 1. ¿Qué objetivo operacional ayuda a cumplir?

La pantalla existe para eliminar una pregunta, acelerar una decisión o completar un paso del [día operativo](./EATCLEAN_DIA_OPERATIVO.md).

- Vincular a un [Momento de Decisión](./MOMENTOS_DE_DECISION.md) o a un [Operational Check](./OPERATIONAL_CHECKS.md).
- Nunca «informar por informar». Nunca dashboards de vanity metrics.
- Filtro: **¿qué pregunta elimina?** — no ¿qué tablas necesita?

### 2. ¿Qué Capability está materializando?

La pantalla es la superficie visible de una Capability declarada en el [Capability Roadmap](./CAPABILITY_ROADMAP.md) y trazada en [Capability Mapping](../17-operational-model/06-capability-mapping/README.md).

- Nombre exacto de la Capability (p. ej. `dishes.manage`).
- Una pantalla puede componer varias Capabilities, pero cada una debe estar declarada.
- Prohibido inventar Capabilities en la UI: primero se declara en el Operational Model, después se dibuja.

### 3. ¿Qué objeto operacional representa?

La pantalla trabaja sobre uno o varios [Core Objects](../17-operational-model/02-core-objects/README.md) — nunca sobre conceptos ajenos al modelo.

- Nombre canónico del [Ubiquitous Language](../17-operational-model/01-ubiquitous-language/README.md) (Nivel 1). Nada de «Customer», «Package suelto», etc.
- Respeta invariantes y transiciones del [Lifecycle](../17-operational-model/04-lifecycles/README.md).
- No introduce nuevos objetos: si hace falta uno → **REQUIRES KNOWLEDGE REVIEW** (no implementar).

---

## Cabecera obligatoria en cada especificación de pantalla

Toda pantalla nueva se documenta con este bloque al inicio:

```md
## Screen: <Nombre>

- Objetivo operacional: <momento / check / decisión que resuelve>
- Capability: <capability.key>
- Core Object(s): <Dish | Order | Recipe | …>
```

Sin este bloque, la pantalla **no pasa Definition of Done** ([DoD](../00-status/DEFINITION_OF_DONE.md)).

---

## Prohibiciones permanentes

1. Pantallas «porque parecen útiles».
2. Pantallas que no citen Capability existente.
3. Pantallas que operen sobre objetos fuera del Operational Model.
4. Pantallas que introduzcan lógica de negocio no declarada.
5. Pantallas cuya única función sea mostrar información sin acción posible.

---

## Enlaces

- [Filosofía de Producto](../05-architecture/FILOSOFIA_DE_PRODUCTO.md)
- [Identidad · Asistentes Operativos](./IDENTIDAD_ASISTENTES_OPERATIVOS.md)
- [Momentos de Decisión](./MOMENTOS_DE_DECISION.md)
- [Operational Checks](./OPERATIONAL_CHECKS.md)
- [Capability Roadmap](./CAPABILITY_ROADMAP.md)
- [Operational Model — Core Objects](../17-operational-model/02-core-objects/README.md)
- [Ubiquitous Language](../17-operational-model/01-ubiquitous-language/README.md)
- [Definition of Done](../00-status/DEFINITION_OF_DONE.md)
