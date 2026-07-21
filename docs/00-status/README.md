# Estado del proyecto

**Última actualización:** 2026-07-21  
**Versión:** `v0.1.0` — FOUNDATION LOCKED  

## Fase actual: YOURMEAL OPERATIONAL MODEL (Core Operativo)

No es el Core técnico (DDD).  
Es el **lenguaje permanente** de la operación de comida preparada.

```text
Foundation ✅ → Blueprint ✅ (diseño estratégico cerrado)
        ↓
Operational Model ⏳  ← diccionario oficial del sistema
        ↓
Observation EatClean  (valida / ajusta / amplía)
```

| Pregunta anterior | Pregunta ahora |
|-------------------|----------------|
| ¿Qué funcionalidades tendrá? | ¿Qué objetos existen en cualquier negocio de comida preparada? |

Índice: [docs/17-operational-model/](../17-operational-model/README.md)

**No es un cuarto pilar.** Es el equivalente producto del Domain Model.

---

## Tres pilares (+ modelo de lenguaje)

| Pilar / bloque | Pregunta | Estado |
|----------------|----------|--------|
| **FOUNDATION** | ¿Cómo construimos? | ✅ |
| **PRODUCT BLUEPRINT** | ¿Qué / por qué? | ✅ cerrado (fase diseño) |
| **OPERATIONAL DISCOVERY** | ¿Por qué evolucionar? | ✅ carpeta · ⏳ evidencia |
| **Operational Model** | ¿Con qué lenguaje? | ⏳ v0.1 |

```text
Producto:  Discovery → Check → Assistant → Capability
Lenguaje:  Operational Model (objetos · relaciones · invariantes)
Técnica:   Capability → Use Cases → Domain → Infrastructure
```

> Capturamos conocimiento operativo → lógica reutilizable.  
> Unidad mínima de valor: [Operational Check](../15-product/OPERATIONAL_CHECKS.md).  
> Objetos permanentes: [Operational Model](../17-operational-model/README.md).

---

## Qué no hacer en esta fase

- Pantallas · APIs · migraciones «por el modelo»  
- Inventar Capabilities nuevas sin mapa a objetos  
- Sustituir Observation: el modelo v0.1 se **valida** en EatClean, no se canoniza a ciegas

## En paralelo

- [FIRST_OBSERVATION_DAY](../16-operational-discovery/FIRST_OBSERVATION_DAY.md) — etnógrafo; Checks implícitos  
- Integration / UI Dish solo sobre Capability ya validada

| Índice | Ruta |
|--------|------|
| Operational Model | [docs/17-operational-model/](../17-operational-model/README.md) |
| Checks | [OPERATIONAL_CHECKS.md](../15-product/OPERATIONAL_CHECKS.md) |
| Discovery | [docs/16-operational-discovery/](../16-operational-discovery/README.md) |
| Blueprint | [docs/15-product/](../15-product/README.md) |
