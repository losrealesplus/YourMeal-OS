# 04 · Field Observation

EatClean y otras Organizaciones — **bajo lente de validación**.

## Diferencia con Operational Discovery

| | Discovery (16) | Validation (18) |
|---|----------------|-----------------|
| Pregunta | ¿Qué aprendimos para evolucionar? | ¿El modelo explica lo observado? |
| Salida | Findings · Patterns · Candidates | Validation Reports |
| Mezcla con diseño | No (solo evidencia) | No (solo coherencia del modelo) |

> No vamos a descubrir procesos nuevos para inventar features.  
> Vamos a **validar** que el modelo describe correctamente lo que ya ocurre.

Activación: cuando el equipo decida retomar campo **en modo validación**.  
Checklist histórico Discovery: [FIRST_OBSERVATION_DAY.md](../16-operational-discovery/FIRST_OBSERVATION_DAY.md) — usar como apoyo, no como sustituto de esta plantilla.

---

## Plantilla · Observación de campo (FOV-xxx)

```markdown
# FOV-xxx — [Momento observado]

**Fecha / Organización:** …  
**Validation Report:** VR-xxx  
**Origen Discovery (si aplica):** OF-xxx

## Hecho observado (sin opinión)

[Qué ocurrió, en lenguaje de cocina]

## Cadena de comprobación

| Pregunta | Respuesta |
|----------|-----------|
| ¿Existe ya en el modelo? | Sí / Parcial / No |
| Core Objects | … |
| Dependencies recorridas | … |
| Lifecycle que cambia | … |
| Checks que intervienen | … |
| Invariants que protegen | INV-… |

## Pregunta de refutación

¿Este hecho real demuestra que el modelo es insuficiente o incorrecto?

## Dictamen preliminar

⏳ Pendiente → escalar a VR-xxx
```

---

## Reglas en campo

1. Registrar en **lenguaje de cocina**; mapear después a canónico.  
2. No proponer pantallas ni APIs en el acto.  
3. Si «no existe en el modelo» → VR con dictamen 🔁 o 🚨, no parche verbal.  
4. Findings de Discovery pueden **alimentar** un FOV, pero el dictamen vive aquí.

---

## Índice

| ID | Observación | Estado |
|----|-------------|--------|
| — | *(vacío hasta activación de campo)* | ⏸ |

---

## Relacionado

- [16 Operational Discovery](../16-operational-discovery/README.md)  
- [05 validation-reports](../05-validation-reports/README.md)
